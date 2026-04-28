const { getBookings, getBooking, addBooking, updateBooking, deleteBooking } = require('../controllers/bookings');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

// These unit tests are fully mocked.
// No real database connection is used anywhere in this file.
// The goal is to cover all booking controller branches using mock data only.

jest.mock('../models/Booking');
jest.mock('../models/Hotel');
jest.mock('../models/User');

describe('Booking controller tests with mocked data', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

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

  const mockQueryChain = (result) => ({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result)
  });

  const mockQueryChainReject = (error) => ({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockRejectedValue(error)
  });

  const mockPopulateChain = (result) => ({
    populate: jest.fn().mockResolvedValue(result)
  });

  const mockIterableResults = (items) => ({
    length: 0,
    [Symbol.iterator]: function* () {
      yield* items;
    }
  });

  describe('getBookings', () => {
    it('returns paginated bookings for admin with query options', async () => {
      req.user.role = 'admin';
      req.params.hotelId = 'hotel123';
      req.query = { select: 'name', sort: 'createdAt', page: '2', limit: '1', totalPrice: { gt: '100' } };

      Booking.find.mockReturnValue(mockQueryChain([{ _id: 'booking123' }]));
      Booking.countDocuments.mockResolvedValue(10);

      await getBookings(req, res, next);

      expect(Booking.find).toHaveBeenCalled();
      expect(Booking.countDocuments).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1, total: 10 }));
    });

    it('returns user bookings for non-admin and ignores user query param', async () => {
      req.user.role = 'user';
      req.query = { user: 'other', sort: 'createdAt' };

      Booking.find.mockReturnValue(mockQueryChain([{ _id: 'booking999', user: 'user123' }]));
      Booking.countDocuments.mockResolvedValue(1);

      await getBookings(req, res, next);

      expect(Booking.find).toHaveBeenCalledWith(expect.objectContaining({ user: 'user123' }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 when Booking query execution throws', async () => {
      Booking.find.mockReturnValue(mockQueryChainReject(new Error('DB failure')));
      Booking.countDocuments.mockResolvedValue(0);

      await getBookings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('getBooking', () => {
    it('returns a booking when found', async () => {
      req.params.id = 'booking123';
      Booking.findById.mockReturnValue(mockPopulateChain({ _id: 'booking123', hotel: {}, transportation: {} }));

      await getBooking(req, res, next);

      expect(Booking.findById).toHaveBeenCalledWith('booking123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when booking is not found', async () => {
      req.params.id = 'booking404';
      Booking.findById.mockReturnValue(mockPopulateChain(null));

      await getBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('returns 500 when Booking.findById throws', async () => {
      req.params.id = 'booking500';
      Booking.findById.mockImplementation(() => { throw new Error('fail'); });

      await getBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('addBooking', () => {
    it('creates a booking for admin with explicit user', async () => {
      req.user.role = 'admin';
      req.params.hotelId = 'hotel123';
      req.body = { user: 'otherUser', checkInDate: '2024-05-01', checkOutDate: '2024-05-03' };

      User.findById.mockResolvedValue({ _id: 'otherUser' });
      Booking.find.mockResolvedValue([]);
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.create.mockResolvedValue({ _id: 'booking123' });

      await addBooking(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('otherUser');
      expect(Booking.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('creates a booking for non-admin with implicit user id', async () => {
      req.user.role = 'user';
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-02' };

      User.findById.mockResolvedValue({ _id: 'user123' });
      Booking.find.mockResolvedValue([]);
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.create.mockResolvedValue({ _id: 'booking456' });

      await addBooking(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Booking.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 when check-in or check-out is missing', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01' };

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Please provide both check-in and check-out dates' }));
    });

    it('returns 400 for invalid date format', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: 'invalid', checkOutDate: '2024-06-02' };

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid check-in or check-out date format' }));
    });

    it('returns 400 when check-out is before check-in', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-05', checkOutDate: '2024-06-04' };

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Check-out date must be after check-in date' }));
    });

    it('returns 400 when requested nights exceed 3', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-06' };

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'A single booking cannot exceed 3 nights.' }));
    });

    it('returns 404 when user is not found', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-02' };
      User.findById.mockResolvedValue(null);

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('No user with the id') }));
    });

    it('returns 400 when existing booking exists for hotel', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-02' };
      User.findById.mockResolvedValue({ _id: 'user123' });
      Booking.find.mockResolvedValue([{ numberOfNights: 1 }]);

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'You can only have 1 active booking per hotel' }));
    });

    it('returns 404 when the hotel is not found', async () => {
      req.params.hotelId = 'hotelMissing';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-02' };
      User.findById.mockResolvedValue({ _id: 'user123' });
      Booking.find.mockResolvedValue([]);
      Hotel.findById.mockResolvedValue(null);

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when total nights at the hotel would exceed 3', async () => {
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-03' };
      User.findById.mockResolvedValue({ _id: 'user123' });
      Booking.find.mockResolvedValue(mockIterableResults([{ numberOfNights: 2 }]));
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('cannot exceed 3 nights total per hotel') }));
    });

    it('returns 500 when Booking.create throws', async () => {
      req.user.role = 'user';
      req.params.hotelId = 'hotel123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-03' };
      User.findById.mockResolvedValue({ _id: 'user123' });
      Booking.find.mockResolvedValue([]);
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.create.mockImplementation(() => { throw new Error('create failed'); });

      await addBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Cannot create Booking') }));
    });
  });

  describe('updateBooking', () => {
    it('returns 404 when booking is missing', async () => {
      req.params.id = 'missing';
      Booking.findById.mockResolvedValue(null);

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 401 when non-owner user tries to update', async () => {
      req.params.id = 'booking123';
      Booking.findById.mockResolvedValue({ user: { toString: () => 'other' }, hotel: { toString: () => 'hotel123' } });

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not authorized') }));
    });

    it('returns 404 when admin updates and user is missing', async () => {
      req.user.role = 'admin';
      req.params.id = 'booking123';
      req.body = { user: 'missingUser', hotel: 'hotel123', checkInDate: '2024-06-01' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue(null);

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('No user with the id') }));
    });

    it('returns 404 when admin updates and hotel is missing', async () => {
      req.user.role = 'admin';
      req.params.id = 'booking123';
      req.body = { user: 'user123', hotel: 'missingHotel', checkInDate: '2024-06-01' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue(null);

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('No hotel with the id') }));
    });

    it('returns 400 for invalid update date format', async () => {
      req.params.id = 'booking123';
      req.body = { checkInDate: 'bad-date' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid check-in or check-out date format' }));
    });

    it('returns 400 when updated dates are non-positive nights', async () => {
      req.params.id = 'booking123';
      req.body = { checkInDate: '2024-06-02', checkOutDate: '2024-06-02' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Check-out date must be after check-in date' }));
    });

    it('returns 400 when updated nights exceed 3', async () => {
      req.params.id = 'booking123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-05' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'A single booking cannot exceed 3 nights.' }));
    });

    it('returns 400 when another active booking exists for hotel', async () => {
      req.params.id = 'booking123';
      req.user.role = 'admin';
      req.body = { user: 'user123', hotel: 'hotel123', checkInDate: '2024-06-01', checkOutDate: '2024-06-02' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.find.mockResolvedValue([{ _id: 'otherBooking' }]);

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'You can only have 1 active booking per hotel' }));
    });

    it('returns 400 when updated total nights exceed 3 across hotel bookings', async () => {
      req.params.id = 'booking123';
      req.user.role = 'admin';
      req.body = { user: 'user123', hotel: 'hotel123', checkInDate: '2024-06-01', checkOutDate: '2024-06-03' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.find.mockResolvedValue([{ _id: 'otherBooking', numberOfNights: 2 }]);

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('cannot exceed 3 nights total per hotel') }));
    });

    it('updates booking successfully for owner without admin privileges', async () => {
      req.params.id = 'booking123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-03' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.find.mockResolvedValue([]);
      Booking.findByIdAndUpdate.mockResolvedValue({ _id: 'booking123' });

      await updateBooking(req, res, next);

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith('booking123', expect.any(Object), expect.objectContaining({ new: true }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 if update throws', async () => {
      req.params.id = 'booking123';
      req.body = { checkInDate: '2024-06-01', checkOutDate: '2024-06-02' };
      Booking.findById.mockResolvedValue({ _id: 'booking123', user: { toString: () => 'user123' }, hotel: { toString: () => 'hotel123' }, checkInDate: '2024-05-01', checkOutDate: '2024-05-02' });
      User.findById.mockResolvedValue({ _id: 'user123' });
      Hotel.findById.mockResolvedValue({ _id: 'hotel123' });
      Booking.find.mockResolvedValue([]);
      Booking.findByIdAndUpdate.mockImplementation(() => { throw new Error('update failed'); });

      await updateBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('deleteBooking', () => {
    it('returns 404 when booking does not exist', async () => {
      req.params.id = 'missing';
      Booking.findById.mockResolvedValue(null);

      await deleteBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 401 when a non-owner user tries to delete', async () => {
      req.params.id = 'booking123';
      Booking.findById.mockResolvedValue({ user: { toString: () => 'other' }, deleteOne: jest.fn() });

      await deleteBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('deletes booking successfully for owner', async () => {
      req.params.id = 'booking123';
      const mockBooking = { user: { toString: () => 'user123' }, deleteOne: jest.fn().mockResolvedValue() };
      Booking.findById.mockResolvedValue(mockBooking);

      await deleteBooking(req, res, next);

      expect(mockBooking.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deletes booking successfully for admin', async () => {
      req.user.role = 'admin';
      req.params.id = 'booking123';
      const mockBooking = { user: { toString: () => 'other' }, deleteOne: jest.fn().mockResolvedValue() };
      Booking.findById.mockResolvedValue(mockBooking);

      await deleteBooking(req, res, next);

      expect(mockBooking.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 when delete throws', async () => {
      req.params.id = 'booking123';
      const mockBooking = { user: { toString: () => 'user123' }, deleteOne: jest.fn().mockImplementation(() => { throw new Error('delete fail'); }) };
      Booking.findById.mockResolvedValue(mockBooking);

      await deleteBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
