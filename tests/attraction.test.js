const request = require('supertest');
const express = require('express');
const attractionController = require('../controllers/attractions');
const Attraction = require('../models/Attraction');

// Mock the Attraction Model
jest.mock('../models/Attraction');

const app = express();
app.use(express.json());

// Define routes for testing
app.get('/api/v1/attractions', attractionController.getAttractions);
app.get('/api/v1/attractions/:id', attractionController.getAttraction);
app.post('/api/v1/attractions', attractionController.createAttraction);
app.put('/api/v1/attractions/:id', attractionController.updateAttraction);
app.delete('/api/v1/attractions/:id', attractionController.deleteAttraction);

describe('Attractions Controller (Unit Test - 100% Coverage)', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/attractions (getAttractions)', () => {
    it('should return all attractions with pagination, filters, and sorting', async () => {
      const mockData = [{ name: 'Temple A' }];
      Attraction.countDocuments.mockResolvedValue(1);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockData)
      };
      Attraction.find.mockReturnValue(mockQuery);

      const res = await request(app)
        .get('/api/v1/attractions')
        .query({ name: 'Temple', select: 'name', sort: 'name', page: '2', limit: '1' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.prev).toBeDefined();
    });

    // FIX LINE 24: Test regex replacement for gt, gte, lt, lte, in
    it('should replace query operators with $ prefix for filtering', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };
      Attraction.find.mockReturnValue(mockQuery);
      Attraction.countDocuments.mockResolvedValue(0);

      await request(app).get('/api/v1/attractions').query({ 'price[gt]': '500' });
      
      // ตรวจสอบว่า find ถูกเรียกด้วย $gt (บรรทัดที่ 24 ใน attractions.js)
      expect(Attraction.find).toHaveBeenCalledWith({ "price[$gt]": "500" });
    });

    // FIX LINE 54: Test pagination "next" branch
    it('should show next page in pagination when there are more results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ name: 'Test' }])
      };
      Attraction.find.mockReturnValue(mockQuery);
      // Mock ให้มีข้อมูลทั้งหมด 100 รายการ เพื่อให้หน้า 1 มี "next"
      Attraction.countDocuments.mockResolvedValue(100);

      const res = await request(app).get('/api/v1/attractions').query({ page: '1', limit: '10' });
      
      expect(res.body.pagination.next).toBeDefined();
      expect(res.body.pagination.next.page).toBe(2);
    });

    it('should handle default sorting and empty pagination', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };
        Attraction.find.mockReturnValue(mockQuery);
        Attraction.countDocuments.mockResolvedValue(0);
  
        const res = await request(app).get('/api/v1/attractions');
        expect(res.statusCode).toBe(200);
        expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
    });

    it('should catch errors and return 400', async () => {
      Attraction.find.mockImplementation(() => { throw new Error('Database Error'); });
      const res = await request(app).get('/api/v1/attractions');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/attractions/:id (getAttraction)', () => {
    it('should return 200 and data if attraction exists', async () => {
      Attraction.findById.mockResolvedValue({ name: 'Test' });
      const res = await request(app).get('/api/v1/attractions/valid_id');
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if attraction not found', async () => {
      Attraction.findById.mockResolvedValue(null);
      const res = await request(app).get('/api/v1/attractions/not_found_id');
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 on error', async () => {
      Attraction.findById.mockRejectedValue(new Error('Invalid ID format'));
      const res = await request(app).get('/api/v1/attractions/invalid_id');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/attractions (createAttraction)', () => {
    it('should create a new attraction and return 201', async () => {
      const body = { name: 'New Place', category: 'museum' };
      Attraction.create.mockResolvedValue(body);
      const res = await request(app).post('/api/v1/attractions').send(body);
      expect(res.statusCode).toBe(201);
    });

    it('should return 400 if validation fails', async () => {
      Attraction.create.mockRejectedValue(new Error('Validation Failed'));
      const res = await request(app).post('/api/v1/attractions').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/attractions/:id (updateAttraction)', () => {
    it('should update and return 200', async () => {
      Attraction.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
      const res = await request(app).put('/api/v1/attractions/123').send({ name: 'Updated' });
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 if not found', async () => {
      Attraction.findByIdAndUpdate.mockResolvedValue(null);
      const res = await request(app).put('/api/v1/attractions/123').send({ name: 'Updated' });
      expect(res.statusCode).toBe(400);
    });

    // FIX LINE 128: Test catch block for update error
    it('should return 400 when update process throws an error', async () => {
      Attraction.findByIdAndUpdate.mockRejectedValue(new Error('Update Failed'));
      const res = await request(app).put('/api/v1/attractions/123').send({ name: 'Fail' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/attractions/:id (deleteAttraction)', () => {
    it('should delete and return 200', async () => {
      Attraction.findById.mockResolvedValue({ _id: '123' });
      Attraction.deleteOne.mockResolvedValue({});
      const res = await request(app).delete('/api/v1/attractions/123');
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if not found for deletion', async () => {
      Attraction.findById.mockResolvedValue(null);
      const res = await request(app).delete('/api/v1/attractions/123');
      expect(res.statusCode).toBe(404);
    });

    it('should catch errors on delete', async () => {
      Attraction.findById.mockRejectedValue(new Error('Delete Error'));
      const res = await request(app).delete('/api/v1/attractions/123');
      expect(res.statusCode).toBe(400);
    });
  });
});