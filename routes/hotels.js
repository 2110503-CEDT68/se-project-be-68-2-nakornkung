/**
 * @swagger
 * tags:
 *   - name: Hotels
 *     description: Hotel management
 * /api/v1/hotels:
 *   get:
 *     tags: [Hotels]
 *     summary: Get list of hotels
 *     parameters:
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Select specific fields to return
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort results by field
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of hotels returned successfully
 *   post:
 *     tags: [Hotels]
 *     summary: Create a new hotel
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *       400:
 *         description: Invalid request payload
 * /api/v1/hotels/{id}:
 *   get:
 *     tags: [Hotels]
 *     summary: Get a single hotel by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel data returned successfully
 *       404:
 *         description: Hotel not found
 *   put:
 *     tags: [Hotels]
 *     summary: Update an existing hotel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *       404:
 *         description: Hotel not found
 *   delete:
 *     tags: [Hotels]
 *     summary: Delete a hotel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 *       404:
 *         description: Hotel not found
 */
const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');
const bookingRouter = require('./bookings');
const router = express.Router();

router.use('/:hotelId/bookings/', bookingRouter);

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getHotels)
  .post(protect, authorize('admin'), createHotel);

router.route('/:id')
  .get(getHotel)
  .put(protect, authorize('admin'), updateHotel)
  .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;
