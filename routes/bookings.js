/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: Hotel booking management
 * /api/v1/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get bookings for the authenticated user or admin
 *     security:
 *       - bearerAuth: []
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
 *         description: Booking list returned successfully
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking for a hotel
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking created successfully
 * /api/v1/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get a booking by ID
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
 *         description: Booking returned successfully
 *       404:
 *         description: Booking not found
 *   put:
 *     tags: [Bookings]
 *     summary: Update an existing booking
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
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *   delete:
 *     tags: [Bookings]
 *     summary: Delete a booking
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
 *         description: Booking deleted successfully
 * /api/v1/hotels/{hotelId}/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get bookings for a specific hotel (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel bookings returned successfully
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking for a hotel by hotel ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking created successfully for hotel
 */
const express = require('express');
const {getBookings , getBooking , addBooking , updateBooking , deleteBooking} = require('../controllers/bookings');
const router = express.Router({ mergeParams: true }); //mergeParams = allows this router to see params from parent route
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getBookings)
  .post(protect, authorize('admin', 'user'), addBooking);
router.route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('admin', 'user'), updateBooking)
  .delete(protect, authorize('admin', 'user'), deleteBooking);

module.exports = router;
