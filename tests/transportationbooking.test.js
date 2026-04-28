const {
  getTransportationBookings,
  getTransportationBooking,
  addTransportationBooking,
  updateTransportationBooking,
  deleteTransportationBooking
} = require('../controllers/transportationBookings');
const TransportationBooking = require('../models/TransportationBooking');
const Transportation = require('../models/Transportation');
const Booking = require('../models/Booking');

// Mock the models
jest.mock('../models/TransportationBooking');
jest.mock('../models/Transportation');
jest.mock('../models/Booking');

describe('TransportationBookings Controller', () => {
  let req, res, next;

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

  describe('getTransportationBookings', () => {
    it('should return all transportation bookings for user', async () => {
      const mockData = [{ _id: '1', user: 'user123' }];
      const mockQuery = {
        populate: jest.fn().mockImplementation(function() { return Promise.resolve(mockData); })
      };
      TransportationBooking.find.mockReturnValue(mockQuery);

      await getTransportationBookings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 1 })
      );
    });

    it('should return 500 on error', async () => {
      TransportationBooking.find.mockImplementation(() => { throw new Error('Database Error'); });

      await getTransportationBookings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTransportationBooking', () => {
    it('should return 200 and data if booking exists', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue({ _id: '123', user: 'user123' })
      };
      TransportationBooking.findById.mockReturnValue(mockQuery);
      req.params = { id: '123' };

      await getTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if booking not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };
      TransportationBooking.findById.mockReturnValue(mockQuery);
      req.params = { id: 'not_found_id' };

      await getTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      const mockQuery = {
        populate: jest.fn().mockImplementation(() => { throw new Error('Database Error'); })
      };
      TransportationBooking.findById.mockReturnValue(mockQuery);
      req.params = { id: 'invalid_id' };

      await getTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addTransportationBooking', () => {
    it('should create a new transportation booking and return 201', async () => {
      const mockBooking = { _id: 'booking123', user: 'user123' };
      const mockTransportation = { _id: 'trans123', name: 'Bus A' };
      const mockTransportationBooking = { _id: 'tb123', booking: 'booking123', transportation: 'trans123' };

      Booking.findById.mockResolvedValue(mockBooking);
      Transportation.findById.mockResolvedValue(mockTransportation);
      TransportationBooking.create.mockResolvedValue(mockTransportationBooking);
      Booking.findByIdAndUpdate.mockResolvedValue(mockBooking);

      req.params = { transportationId: 'trans123' };
      req.body = { booking: 'booking123', departureDateTime: '2024-01-01', passengerNumber: 2 };

      await addTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById.mockResolvedValue(null);

      req.params = { transportationId: 'trans123' };
      req.body = { booking: 'invalid_booking', departureDateTime: '2024-01-01', passengerNumber: 2 };

      await addTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if transportation not found', async () => {
      Booking.findById.mockResolvedValue({ _id: 'booking123' });
      Transportation.findById.mockResolvedValue(null);

      req.params = { transportationId: 'invalid_trans' };
      req.body = { booking: 'booking123', departureDateTime: '2024-01-01', passengerNumber: 2 };

      await addTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      Booking.findById.mockImplementation(() => { throw new Error('Database Error'); });

      req.params = { transportationId: 'trans123' };
      req.body = { booking: 'booking123', departureDateTime: '2024-01-01', passengerNumber: 2 };

      await addTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTransportationBooking', () => {
    it('should update and return 200', async () => {
      const mockBooking = { _id: '123', user: { toString: () => 'user123' } };
      TransportationBooking.findById.mockResolvedValue(mockBooking);
      TransportationBooking.findByIdAndUpdate.mockResolvedValue({ _id: '123', passengerNumber: 5 });

      req.params = { id: '123' };
      req.body = { passengerNumber: 5 };

      await updateTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if booking not found', async () => {
      TransportationBooking.findById.mockResolvedValue(null);

      req.params = { id: '123' };
      req.body = { passengerNumber: 5 };

      await updateTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if unauthorized', async () => {
      const mockBooking = { _id: '123', user: { toString: () => 'other_user' } };
      TransportationBooking.findById.mockResolvedValue(mockBooking);

      req.params = { id: '123' };
      req.body = { passengerNumber: 5 };

      await updateTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on error', async () => {
      TransportationBooking.findById.mockImplementation(() => { throw new Error('Database Error'); });

      req.params = { id: '123' };
      req.body = { passengerNumber: 5 };

      await updateTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTransportationBooking', () => {
    it('should delete and return 200', async () => {
      const mockBooking = {
        _id: '123',
        user: { toString: () => 'user123' },
        booking: 'booking123',
        deleteOne: jest.fn().mockResolvedValue(true)
      };
      TransportationBooking.findById.mockResolvedValue(mockBooking);
      Booking.findByIdAndUpdate.mockResolvedValue({});

      req.params = { id: '123' };

      await deleteTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      TransportationBooking.findById.mockResolvedValue(null);

      req.params = { id: '123' };

      await deleteTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if unauthorized', async () => {
      const mockBooking = { _id: '123', user: { toString: () => 'other_user' } };
      TransportationBooking.findById.mockResolvedValue(mockBooking);

      req.params = { id: '123' };

      await deleteTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on error', async () => {
      TransportationBooking.findById.mockImplementation(() => { throw new Error('Database Error'); });

      req.params = { id: '123' };

      await deleteTransportationBooking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});