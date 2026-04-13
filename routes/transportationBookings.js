const express = require('express');
const {getTransportationBookings, getTransportationBooking, addTransportationBooking, updateTransportationBooking, deleteTransportationBooking} = require('../controllers/transportationBookings');
const { protect,authorize } = require('../middleware/auth') ;

const router = express.Router({ mergeParams: true });

router.route('/').get(protect, getTransportationBookings).post(protect,authorize('admin','user'),addTransportationBooking) ;
router.route('/:id').get(protect, getTransportationBooking).put(protect,authorize('admin','user'),updateTransportationBooking).delete(protect,authorize('admin','user'),deleteTransportationBooking) ;

module.exports = router;