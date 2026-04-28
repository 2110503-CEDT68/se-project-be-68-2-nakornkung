const {
  getTransportations,
  getTransportation,
  createTransportation,
  updateTransportation,
  deleteTransportation
} = require('../controllers/transportations');
const Transportation = require('../models/Transportation');

// Mock the Transportation Model
jest.mock('../models/Transportation');

describe('Transportations Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123', role: 'admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('getTransportations', () => {
    it('should return all transportations with pagination', async () => {
      const mockData = [{ name: 'Bus A', providerName: 'Company A' }];
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(function() { return Promise.resolve(mockData); })
      };
      Transportation.find.mockReturnValue(mockQuery);
      Transportation.countDocuments.mockResolvedValue(1);

      req.query = { name: 'Bus', select: 'name', sort: 'name', page: '2', limit: '1' };

      await getTransportations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({ prev: expect.anything() })
        })
      );
    });

    it('should show next page in pagination when there are more results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(function() { return Promise.resolve([{ name: 'Test' }]); })
      };
      Transportation.find.mockReturnValue(mockQuery);
      Transportation.countDocuments.mockResolvedValue(100);

      req.query = { page: '1', limit: '10' };

      await getTransportations(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({ next: { page: 2, limit: 10 } })
        })
      );
    });

    it('should handle default sorting', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(function() { return Promise.resolve([]); })
      };
      Transportation.find.mockReturnValue(mockQuery);
      Transportation.countDocuments.mockResolvedValue(0);

      await getTransportations(req, res, next);

      expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
    });

    it('should catch errors and return 400', async () => {
      Transportation.find.mockImplementation(() => { throw new Error('Database Error'); });

      await getTransportations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle search functionality', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(function() { return Promise.resolve([]); })
      };
      Transportation.find.mockReturnValue(mockQuery);
      Transportation.countDocuments.mockResolvedValue(0);

      req.query = { search: 'Bus' };

      await getTransportations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle province filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(function() { return Promise.resolve([]); })
      };
      Transportation.find.mockReturnValue(mockQuery);
      Transportation.countDocuments.mockResolvedValue(0);

      req.query = { province: 'Bangkok' };

      await getTransportations(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getTransportation', () => {
    it('should return 200 and data if transportation exists', async () => {
      Transportation.findById.mockResolvedValue({ name: 'Test Bus' });
      req.params = { id: 'valid_id' };

      await getTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if transportation not found', async () => {
      Transportation.findById.mockResolvedValue(null);
      req.params = { id: 'not_found_id' };

      await getTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 on error', async () => {
      Transportation.findById.mockRejectedValue(new Error('Invalid ID format'));
      req.params = { id: 'invalid_id' };

      await getTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createTransportation', () => {
    it('should create a new transportation and return 201', async () => {
      const body = { 
        name: 'New Bus', 
        type: 'bus',
        providerName: 'Company A',
        pickUpArea: { name: 'Station A', address: { district: 'District A', province: 'Province A' } },
        dropOffArea: { name: 'Station B', address: { district: 'District B', province: 'Province B' } },
        price: 500
      };
      Transportation.create.mockResolvedValue(body);
      req.body = body;

      await createTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if validation fails', async () => {
      Transportation.create.mockRejectedValue(new Error('Validation Failed'));
      req.body = {};

      await createTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateTransportation', () => {
    it('should update and return 200', async () => {
      Transportation.findById.mockResolvedValue({ name: 'Old Name', active: true });
      Transportation.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
      req.params = { id: '123' };
      req.body = { name: 'Updated' };

      await updateTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      Transportation.findById.mockResolvedValue(null);
      req.params = { id: '123' };
      req.body = { name: 'Updated' };

      await updateTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 on error', async () => {
      Transportation.findById.mockRejectedValue(new Error('Database Error'));
      req.params = { id: '123' };
      req.body = { name: 'Updated' };

      await updateTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteTransportation', () => {
    it('should delete and return 200', async () => {
      Transportation.findByIdAndUpdate.mockResolvedValue({ name: 'Test' });
      req.params = { id: '123' };

      await deleteTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      Transportation.findByIdAndUpdate.mockResolvedValue(null);
      req.params = { id: '123' };

      await deleteTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 on error', async () => {
      Transportation.findByIdAndUpdate.mockRejectedValue(new Error('Database Error'));
      req.params = { id: '123' };

      await deleteTransportation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});