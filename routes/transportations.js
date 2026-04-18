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
