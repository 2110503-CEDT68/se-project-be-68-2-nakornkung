const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const attractionController = require('../controllers/attractions');
const Attraction = require('../models/Attraction');

// 1. Mock the Attraction Model
// This ensures we don't touch the actual MongoDB database
jest.mock('../models/Attraction');

const app = express();
app.use(express.json());

// Define routes for testing
app.get('/api/v1/attractions', attractionController.getAttractions);
app.get('/api/v1/attractions/:id', attractionController.getAttraction);
app.post('/api/v1/attractions', attractionController.createAttraction);
app.put('/api/v1/attractions/:id', attractionController.updateAttraction);
app.delete('/api/v1/attractions/:id', attractionController.deleteAttraction);

describe('Attractions Controller (Unit Test)', () => {
  
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock data after each test case
  });

  describe('GET /api/v1/attractions (getAttractions)', () => {
    it('should return all attractions with pagination, filters, and sorting', async () => {
      // Mock data and chainable query methods for 100% coverage in filtering logic
      const mockData = [{ name: 'Temple A' }];
      Attraction.countDocuments.mockResolvedValue(1);
      
      // Simulating Mongoose chainable methods: find().select().sort().skip().limit()
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
      expect(res.body.data).toEqual(mockData);
      expect(res.body.pagination.prev).toBeDefined(); // Testing pagination logic
    });

    it('should handle default sorting and empty pagination prev/next', async () => {
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
    });

    it('should catch errors and return 400', async () => {
      Attraction.find.mockImplementation(() => { throw new Error('Database Error'); });
      const res = await request(app).get('/api/v1/attractions');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
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
      expect(res.body.data.name).toBe('New Place');
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

    it('should return 400 if not found (matching logic in controller)', async () => {
      Attraction.findByIdAndUpdate.mockResolvedValue(null);
      const res = await request(app).put('/api/v1/attractions/123').send({ name: 'Updated' });
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