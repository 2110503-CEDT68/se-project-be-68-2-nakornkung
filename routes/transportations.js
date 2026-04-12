const express = require('express');
const router = express.Router();
const { getTransportations } = require('../controllers/transportations'); 
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getTransportations)
  .post(protect, authorize('admin'), addTransportation);
router.route('/:id')
  .get(protect, getTransportation)
  .put(protect, authorize('admin'), updateTransportation)
  .delete(protect, authorize('admin'), deleteTransportation);


module.exports = router;