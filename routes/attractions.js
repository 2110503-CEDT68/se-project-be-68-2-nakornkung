const express = require('express');
const { getAttractions, getAttraction, createAttraction, updateAttraction, deleteAttraction } = require('../controllers/attractions');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getAttractions)
  .post(protect, authorize('admin'), createAttraction);

router.route('/:id')
  .get(getAttraction)
  .put(protect, authorize('admin'), updateAttraction)
  .delete(protect, authorize('admin'), deleteAttraction);

module.exports = router;
