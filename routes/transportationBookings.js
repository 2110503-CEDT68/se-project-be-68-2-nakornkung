/**
 * @swagger
 * tags:
 *   - name: TransportationBookings
 *     description: Transportation booking management
 * /api/v1/transportationBookings:
 *   get:
 *     tags: [TransportationBookings]
 *     summary: Get transportation bookings for the authenticated user or admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transportation bookings returned successfully
 *   post:
 *     tags: [TransportationBookings]
 *     summary: Create a transportation booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransportationBooking'
 *     responses:
 *       200:
 *         description: Transportation booking created successfully
 * /api/v1/transportationBookings/{id}:
 *   get:
 *     tags: [TransportationBookings]
 *     summary: Get a transportation booking by ID
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
 *         description: Transportation booking returned successfully
 *   put:
 *     tags: [TransportationBookings]
 *     summary: Update a transportation booking
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
 *             $ref: '#/components/schemas/TransportationBooking'
 *     responses:
 *       200:
 *         description: Transportation booking updated successfully
 *   delete:
 *     tags: [TransportationBookings]
 *     summary: Delete a transportation booking
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
 *         description: Transportation booking deleted successfully
 */
const express = require('express');
const { protect, authorize } = require('../middleware/auth') ;
const {getTransportationBookings, getTransportationBooking, addTransportationBooking, updateTransportationBooking, deleteTransportationBooking} = require('../controllers/transportationBookings');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(protect, getTransportationBookings)
    .post(protect, authorize('admin','user'), addTransportationBooking) ;
router.route('/:id')
    .get(protect, getTransportationBooking)
    .put(protect, authorize('admin','user'), updateTransportationBooking)
    .delete(protect, authorize('admin','user'), deleteTransportationBooking) ;

module.exports = router;