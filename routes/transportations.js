/**
 * @swagger
 * tags:
 *   - name: Transportations
 *     description: Transportation management
 * /api/v1/transportations:
 *   get:
 *     tags: [Transportations]
 *     summary: Get all transportation options
 *     responses:
 *       200:
 *         description: Transportation list returned successfully
 *   post:
 *     tags: [Transportations]
 *     summary: Create a new transportation option
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transportation'
 *     responses:
 *       201:
 *         description: Transportation created successfully
 * /api/v1/transportations/{id}:
 *   get:
 *     tags: [Transportations]
 *     summary: Get transportation details by ID
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
 *         description: Transportation returned successfully
 *   put:
 *     tags: [Transportations]
 *     summary: Update a transportation option
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
 *             $ref: '#/components/schemas/Transportation'
 *     responses:
 *       200:
 *         description: Transportation updated successfully
 *   delete:
 *     tags: [Transportations]
 *     summary: Delete a transportation option
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
 *         description: Transportation deleted successfully
 * /api/v1/transportations/{transportationId}/transportationBookings:
 *   get:
 *     tags: [Transportations]
 *     summary: Get transportation bookings for a specific transportation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transportationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transportation bookings returned successfully
 */
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const transportationBookingRouter = require('./transportationBookings');
const { getTransportations, getTransportation, createTransportation, updateTransportation, deleteTransportation } = require('../controllers/transportations');

const router = express.Router();

router.use('/:transportationId/transportationBookings', transportationBookingRouter);

router.route('/')
  .get(getTransportations)
  .post(protect, authorize('admin'), createTransportation);
router.route('/:id')
  .get(protect, getTransportation)
  .put(protect, authorize('admin'), updateTransportation)
  .delete(protect, authorize('admin'), deleteTransportation);


module.exports = router;
