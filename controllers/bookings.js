const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

//@desc GET all bookings
//@route GET api/v1/bookings
//@access Private
exports.getBookings = async (req, res, next) => {
  let query;

  const baseFilter = {};
  if (req.user.role != 'admin') {
    baseFilter.user = req.user.id;
  }
  else if (req.params.hotelId) {
    baseFilter.hotel = req.params.hotelId;
  }

  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  if (baseFilter.hotel) {
    delete reqQuery.hotel;
  }
  if (req.user.role != 'admin') {
    delete reqQuery.user;
  }

  let queryStr = JSON.stringify({ ...baseFilter, ...reqQuery });
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,
    match => `$${match}`);

  query = Booking.find(JSON.parse(queryStr)).populate({
    path: 'hotel',
    select: 'name address district province postalcode tel img'
  }).populate({
    path: 'user',
    select: 'name email tel role',
  });

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    const fields = req.query.sort.split(',').join(' ');
    query = query.sort(fields);
  }
  else {
    query = query.sort('-createdAt');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Booking.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  try {
    const bookings = await query;
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination,
      data: bookings
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking"
    });
  }
};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'hotel',
      select: 'name address tel'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking"
    });
  }
};

//@desc     Add booking
//@route    POST /api/v1/hotels/:hotelId/bookings
//@access   Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.hotel = req.params.hotelId;

    if (req.user.role === 'admin') {
      req.body.user = req.body.user || req.user.id;
    }
    else {
      req.body.user = req.user.id;
    }

    //check-in/out
    if (!req.body.checkInDate || !req.body.checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both check-in and check-out dates'
      });
    }

    const checkIn = new Date(req.body.checkInDate);
    const checkOut = new Date(req.body.checkOutDate);
    const requestedNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in or check-out date format'
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    if (requestedNights > 3) {
      return res.status(400).json({
        success: false,
        message: 'A single booking cannot exceed 3 nights.'
      });
    }

    const bookingUser = await User.findById(req.body.user);
    if (!bookingUser) {
      return res.status(404).json({
        success: false,
        message: `No user with the id of ${req.body.user}`
      });
    }

    const existingBookingsForHotel = await Booking.find({
      user: req.body.user,
      hotel: req.params.hotelId
    });

    // 1 booking per hotel
    if (existingBookingsForHotel.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You can only have 1 active booking per hotel'
      });
    }

    // 3 nights per hotel
    let totalNightsForHotel = 0;
    for (const booking of existingBookingsForHotel) {
      totalNightsForHotel += booking.numberOfNights || 0;
    }

    if (totalNightsForHotel + requestedNights > 3) {
      return res.status(400).json({
        success: false,
        message: `User ${req.body.user} has already booked ${totalNightsForHotel} nights at this hotel; cannot exceed 3 nights total per hotel.`
      });
    }

    //hotel
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.hotelId}`
      });
    }

    req.body.numberOfNights = requestedNights;

    const booking = await Booking.create(req.body);

    res.status(200).json({
      success: true,
      data: booking
    });
  }
  catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({
      success: false,
      message: `Cannot create Booking: ${error.message}`
    });
  }
};

//@desc     Update booking
//@router   PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    //Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`
      });
    }

    const targetUserId =
      req.user.role === 'admin' && req.body.user
        ? req.body.user
        : booking.user.toString();
    const targetHotelId =
      req.user.role === 'admin' && req.body.hotel
        ? req.body.hotel
        : booking.hotel.toString();
    const shouldValidateBookingDetails =
      req.body.checkInDate ||
      req.body.checkOutDate ||
      (req.user.role === 'admin' && (req.body.user || req.body.hotel));

    req.body.user = targetUserId;
    req.body.hotel = targetHotelId;

    if (shouldValidateBookingDetails) {
      const bookingUser = await User.findById(targetUserId);
      if (!bookingUser) {
        return res.status(404).json({
          success: false,
          message: `No user with the id of ${targetUserId}`
        });
      }

      const hotel = await Hotel.findById(targetHotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: `No hotel with the id of ${targetHotelId}`
        });
      }

      const checkIn = req.body.checkInDate ? new Date(req.body.checkInDate) : new Date(booking.checkInDate);
      const checkOut = req.body.checkOutDate ? new Date(req.body.checkOutDate) : new Date(booking.checkOutDate);

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid check-in or check-out date format'
        });
      }

      const requestedNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      if (requestedNights <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }

      if (requestedNights > 3) {
        return res.status(400).json({
          success: false,
          message: 'A single booking cannot exceed 3 nights.'
        });
      }

      req.body.numberOfNights = requestedNights;

      const existingBookingsForHotel = await Booking.find({
        user: targetUserId,
        hotel: targetHotelId,
        _id: { $ne: booking._id }
      });

      if (existingBookingsForHotel.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You can only have 1 active booking per hotel'
        });
      }

      let totalNightsForHotel = 0;
      for (const existingBooking of existingBookingsForHotel) {
        totalNightsForHotel += existingBooking.numberOfNights || 0;
      }

      if (totalNightsForHotel + requestedNights > 3) {
        return res.status(400).json({
          success: false,
          message: `User ${targetUserId} has already booked ${totalNightsForHotel} nights at this hotel; cannot exceed 3 nights total per hotel.`
        });
      }
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: booking
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `Cannot update Booking`
    });
  }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    //Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `Cannot delete Booking`
    });
  }
};
