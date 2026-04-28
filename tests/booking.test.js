const {
  getBookings,
  getBooking,
  addBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookings'); // เปลี่ยน path ให้ตรงกับโครงสร้างโปรเจคของคุณ
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

// Mock the models
jest.mock('../models/Booking');
jest.mock('../models/Hotel');
jest.mock('../models/User');

describe('Bookings Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock Express Request and Response
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123', role: 'user' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('getBookings', () => {
    it('should get all bookings for a regular user (filtered by user id)', async () => {
      const mockBookings = [{ name: 'Booking 1' }];
      
      // Mock Mongoose chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(function() { return Promise.resolve(mockBookings); })
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(1);

      await getBookings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
    });

    it('should get all bookings for admin and handle filters/pagination', async () => {
      req.user.role = 'admin';
      req.params.hotelId = 'hotel123';
      req.query = { select: 'name', sort: 'name', page: '2', limit: '10' };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Booking.find.mockReturnValue(mockQuery);
      Booking.countDocuments.mockResolvedValue(25);

      await getBookings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors in getBookings', async () => {
      Booking.find.mockImplementation(() => { throw new Error('Error'); });
      await getBookings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getBooking', () => {
    it('should return a single booking if found', async () => {
      req.params.id = 'booking123';
      const mockBooking = { _id: 'booking123' };
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking)
      });

      await getBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBooking });
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await getBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in getBooking', async () => {
      Booking.findById.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error()) });
      await getBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addBooking', () => {
    beforeEach(() => {
      req.params.hotelId = 'hotel123';
      req.body = {
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-03' // 2 nights
      };
    });

    it('should create a booking successfully', async () => {
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.find.mockResolvedValue([]); // No existing bookings
      Booking.create.mockResolvedValue(req.body);

      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if dates are missing', async () => {
      delete req.body.checkInDate;
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if dates are invalid', async () => {
      req.body.checkInDate = 'invalid';
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if checkout is before checkin', async () => {
      req.body.checkOutDate = '2023-01-01';
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if booking exceeds 3 nights', async () => {
      req.body.checkOutDate = '2024-01-10';
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if user already has a booking at this hotel', async () => {
      User.findById.mockResolvedValue({ id: 'user123' });
      Booking.find.mockResolvedValue([{ _id: 'existing' }]);
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toBeCalledWith(expect.objectContaining({ message: 'You can only have 1 active booking per hotel' }));
    });

    it('should return 404 if hotel not found', async () => {
      User.findById.mockResolvedValue({ id: 'user123' });
      Booking.find.mockResolvedValue([]);
      Hotel.findById.mockResolvedValue(null);
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle admin booking for another user', async () => {
      req.user.role = 'admin';
      req.body.user = 'otheruser';
      User.findById.mockResolvedValue({ id: 'otheruser' });
      Hotel.findById.mockResolvedValue({ id: 'hotel' });
      Booking.find.mockResolvedValue([]);
      await addBooking(req, res, next);
      expect(req.body.user).toBe('otheruser');
    });

    it('should handle error during creation', async () => {
      User.findById.mockRejectedValue(new Error('Fail'));
      await addBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateBooking', () => {
    it('should update booking if user is owner', async () => {
      req.params.id = 'book123';
      const mockBooking = { _id: 'book123', user: 'user123', hotel: 'hotel1', checkInDate: '2024-01-01', checkOutDate: '2024-01-02' };
      Booking.findById.mockResolvedValue(mockBooking);
      User.findById.mockResolvedValue({});
      Hotel.findById.mockResolvedValue({});
      Booking.find.mockResolvedValue([]); // No other bookings
      Booking.findByIdAndUpdate.mockResolvedValue({ ...mockBooking, ...req.body });

      await updateBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if user is not owner and not admin', async () => {
      req.params.id = 'book123';
      Booking.findById.mockResolvedValue({ user: 'someone-else' });
      await updateBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById.mockResolvedValue(null);
      await updateBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should validate dates during update', async () => {
      req.params.id = 'book123';
      req.body.checkInDate = 'invalid';
      Booking.findById.mockResolvedValue({ user: 'user123' });
      await updateBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle admin updating user and hotel', async () => {
      req.user.role = 'admin';
      req.body.user = 'newuser';
      req.body.hotel = 'newhotel';
      Booking.findById.mockResolvedValue({ user: 'olduser', hotel: 'oldhotel' });
      User.findById.mockResolvedValue({});
      Hotel.findById.mockResolvedValue({});
      Booking.find.mockResolvedValue([]);
      await updateBooking(req, res, next);
      expect(Booking.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      Booking.findById.mockRejectedValue(new Error());
      await updateBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteBooking', () => {
    it('should delete booking if owner', async () => {
      const mockBooking = { user: 'user123', deleteOne: jest.fn().mockResolvedValue({}) };
      Booking.findById.mockResolvedValue(mockBooking);
      await deleteBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if not owner', async () => {
      Booking.findById.mockResolvedValue({ user: 'other' });
      await deleteBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 if not found', async () => {
      Booking.findById.mockResolvedValue(null);
      await deleteBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle delete errors', async () => {
      Booking.findById.mockRejectedValue(new Error());
      await deleteBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});