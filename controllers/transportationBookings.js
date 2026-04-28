const TransportationBooking = require('../models/TransportationBooking');
const Transportation = require('../models/Transportation');
const Booking = require('../models/Booking');

// @desc    Get all transportations
// @route   GET /api/v1/transportations
// @access  Public
exports.getTransportationBookings = async (req, res, next) => {
    let query;
    if (req.user.role !== 'admin') {
        query = TransportationBooking.find({ user: req.user.id }).populate({
            path: 'transportation',
            select: 'name providerName type pickUpArea dropOffArea price active'
        });
    } else {
        query = TransportationBooking.find().populate({
            path: 'transportation',
            select: 'name providerName type pickUpArea dropOffArea price active'
        });
    }
    try {
        const transportationBookings = await query;
        res.status(200).json({ success: true, count: transportationBookings.length, data: transportationBookings })
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({ success: false, message: 'Cannot find Booking' });
    }
}

// @desc    Get single transportation
// @route   GET /api/v1/transportations/:id
// @access  Public
exports.getTransportationBooking = async (req, res, next) => {
    try {
        const transportationBooking = await TransportationBooking.findById(req.params.id).populate({
            path: 'transportation',
            select: 'name providerName type pickUpArea dropOffArea price active'
        });
        if (!transportationBooking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        res.status(200).json({ success: true, data: transportationBooking });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
}

// @desc    Create new transportation
// @route   POST /api/v1/transportations
// @access  Private/Admin
exports.addTransportationBooking = async (req, res, next) => {
    try {

        // Check Booking
        const booking = await Booking.findById(req.body.booking);
        console.log(booking);
        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.body.booking}` });
        }

        console.log(req.params.transportationId);
        req.body.transportation = req.params.transportationId;

        const transportation = await Transportation.findById(req.params.transportationId);
        console.log(transportation);
        if (!transportation) {
            return res.status(404).json({ success: false, message: `No transportation with the id of ${req.params.transportationId}` });
        }

        req.body.user = req.user.id;
        const transportationBooking = await TransportationBooking.create(req.body);


        // update transportationBookingId to Booking
        await Booking.findByIdAndUpdate(
            req.body.booking,
            {
                $push: { transportation: transportationBooking._id }
            },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(201).json({ success: true, data: transportationBooking });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Cannot create Booking" });
    }
}

// @desc    Update transportation
// @route   PUT /api/v1/transportations/:id
// @access  Private/Admin
exports.updateTransportationBooking = async (req, res, next) => {
    try {
        let transportationBooking = await TransportationBooking.findById(req.params.id);
        if (!transportationBooking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (transportationBooking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        transportationBooking = await TransportationBooking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: transportationBooking });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Cannot update Booking" });
    }
}

// @desc    Delete transportation
// @route   DELETE /api/v1/transportations/:id
// @access  Private/Admin
exports.deleteTransportationBooking = async (req, res, next) => {
    try {
        const transportationBooking = await TransportationBooking.findById(req.params.id);
        console.log(req.params.id) ;
        if (!transportationBooking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (transportationBooking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }
        
        //delete transportationBookingId from booking
        await Booking.findByIdAndUpdate(
            transportationBooking.booking,
            {
                $pull : { transportation: transportationBooking._id }
            },
            {
                new: true,
                runValidators: true
            }
        );
        await transportationBooking.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Cannot delete Booking" });
    }
}