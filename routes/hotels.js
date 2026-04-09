const express = require('express');
const multer = require('multer');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');
const bookingRouter = require('./bookings');
const router = express.Router();

router.use('/:hotelId/bookings/', bookingRouter);

const { protect, authorize } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .get(getHotels)
  .post(protect, authorize('admin'), upload.single('img'), createHotel);

router.route('/:id')
  .get(getHotel)
  .put(protect, authorize('admin'), upload.single('img'), updateHotel)
  .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;
