const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel
} = require('../controllers/hotels'); // Path to your controller
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

// Mock the models
jest.mock('../models/Hotel');
jest.mock('../models/Booking');

describe('Hotel Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock Express request and response objects
    req = {
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('getHotels', () => {
    it('should get all hotels with pagination and filters (Success)', async () => {
      req.query = { 
        name: 'Grand', 
        select: 'name,address', 
        sort: 'name', 
        page: '1', 
        limit: '10' 
      };

      const mockHotels = [{ name: 'Grand Hotel' }];
      
      // Mocking complex mongoose chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHotels)
      };

      Hotel.find.mockReturnValue(mockQuery);
      Hotel.countDocuments.mockResolvedValue(1);

      await getHotels(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 1,
        total: 1,
        data: mockHotels
      }));
    });

    it('should support filter operators like gt and parse query correctly', async () => {
      req.query = { 'price[gt]': '100', page: '1', limit: '10' };
      const mockHotels = [{ name: 'Filtered Hotel' }];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHotels)
      };

      Hotel.find.mockImplementation((filter) => {
        expect(filter).toEqual({ 'price[$gt]': '100' });
        return mockQuery;
      });
      Hotel.countDocuments.mockImplementation((filter) => {
        expect(filter).toEqual({ 'price[$gt]': '100' });
        return Promise.resolve(1);
      });

      await getHotels(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 1,
        total: 1,
        data: mockHotels
      }));
    });

    it('should handle pagination next/prev and default sort', async () => {
        req.query = { page: '2', limit: '1' };
        Hotel.countDocuments.mockResolvedValue(3); // Total 3, page 2, limit 1 -> has both next and prev
        
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([{ name: 'Hotel 2' }])
        };
        Hotel.find.mockReturnValue(mockQuery);

        await getHotels(req, res, next);
        
        const response = res.json.mock.calls[0][0];
        expect(response.pagination).toHaveProperty('next');
        expect(response.pagination).toHaveProperty('prev');
    });

    it('should use default page and limit when omitted', async () => {
      req.query = { name: 'Default Hotel' };
      const mockHotels = [{ name: 'Default Hotel' }];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockHotels)
      };

      Hotel.find.mockReturnValue(mockQuery);
      Hotel.countDocuments.mockResolvedValue(1);

      await getHotels(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 1,
        total: 1,
        data: mockHotels
      }));
    });

    it('should handle error in getHotels', async () => {
      Hotel.find.mockImplementation(() => { throw new Error('Database Error'); });
      
      await getHotels(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database Error'
      });
    });
  });

  describe('getHotel', () => {
    it('should get a single hotel by id', async () => {
      req.params.id = 'hotel123';
      const mockHotel = { _id: 'hotel123', name: 'Test Hotel' };
      
      Hotel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockHotel)
      });

      await getHotel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockHotel });
    });

    it('should return 404 if hotel not found', async () => {
      req.params.id = 'invalid';
      Hotel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getHotel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error in getHotel', async () => {
        Hotel.findById.mockImplementation(() => { throw new Error('Error'); });
        await getHotel(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createHotel', () => {
    it('should create a new hotel', async () => {
      req.body = { name: 'New Hotel', address: '123 St' };
      Hotel.create.mockResolvedValue(req.body);

      await createHotel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: req.body });
    });

    it('should handle creation error', async () => {
      Hotel.create.mockRejectedValue(new Error('Validation Failed'));
      await createHotel(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateHotel', () => {
    it('should update an existing hotel', async () => {
      req.params.id = 'hotel123';
      req.body = { name: 'Updated Name' };
      Hotel.findByIdAndUpdate.mockResolvedValue(req.body);

      await updateHotel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: req.body });
    });

    it('should return 404 if update target not found', async () => {
      Hotel.findByIdAndUpdate.mockResolvedValue(null);
      await updateHotel(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle update error', async () => {
        Hotel.findByIdAndUpdate.mockRejectedValue(new Error('Error'));
        await updateHotel(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteHotel', () => {
    it('should delete hotel and its bookings', async () => {
      req.params.id = 'hotel123';
      const mockHotel = { _id: 'hotel123' };
      
      Hotel.findById.mockResolvedValue(mockHotel);
      Booking.deleteMany.mockResolvedValue({});
      Hotel.deleteOne.mockResolvedValue({});

      await deleteHotel(req, res, next);

      expect(Booking.deleteMany).toHaveBeenCalledWith({ hotel: 'hotel123' });
      expect(Hotel.deleteOne).toHaveBeenCalledWith({ _id: 'hotel123' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if delete target not found', async () => {
      Hotel.findById.mockResolvedValue(null);
      await deleteHotel(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle delete error', async () => {
        Hotel.findById.mockRejectedValue(new Error('Error'));
        await deleteHotel(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});