const express = require('express');
const multer = require('multer');
const { getTransportations, getTransportation, createTransportation, updateTransportation, deleteTransportation } = require('../controllers/transportations');
const transportationBookingRouter = require('./transportationBookings');
const router = express.Router();

router.use('/:transportationId/transportationBookings/', transportationBookingRouter);

const { protect, authorize } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .get(getTransportations)
  .post(protect, authorize('admin'), upload.single('img'), createTransportation);

router.route('/:id')
  .get(getTransportation)
  .put(protect, authorize('admin'), upload.single('img'), updateTransportation)
  .delete(protect, authorize('admin'), deleteTransportation);

module.exports = router;
