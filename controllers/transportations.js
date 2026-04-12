const Transportation = require('../models/Transportation');
const TransportationBooking = require('../models/TransportationBooking');

// @desc    Get all transportations
// @route   GET /api/v1/transportations
// @access  Public
exports.getTransportations = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    const searchableFields = ['name', 'type', 'providerName'];

    removeFields.forEach(param => delete reqQuery[param]);

    searchableFields.forEach((field) => {
      if (typeof reqQuery[field] === 'string' && reqQuery[field].trim()) {
        reqQuery[field] = { $regex: reqQuery[field].trim(), $options: 'i' };
      }
    });

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,
      match => `$${match}`);
    const filters = JSON.parse(queryStr);

    query = Transportation.find(filters);

    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    if (req.query.sort) {
      const fields = req.query.sort.split(',').join(' ');
      query = query.sort(fields);
    }
    else {
      query = query.sort('-createAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Transportation.countDocuments(filters);

    query = query.skip(startIndex).limit(limit);

    const transportations = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = { page: page + 1, limit }
    }

    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit }
    }

    res.status(200).json({
      success: true,
      count: transportations.length,
      total,
      pagination,
      data: transportations
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single transportation
// @route   GET /api/v1/transportations/:id
// @access  Public
exports.getTransportation = async (req, res, next) => {
  try {
    const transportation = await Transportation.findById(req.params.id);

    if (!transportation) {
      return res.status(404).json({
        success: false,
        message: `Transportation not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({ success: true, data: transportation });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Create new transportation
// @route   POST /api/v1/transportations
// @access  Private/Admin
exports.createTransportation = async (req, res, next) => {
  try {
    const transportationData = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      providerName: req.body.providerName,
      pickUpArea: req.body.pickUpArea,
      dropOffArea: req.body.dropOffArea,
      price: req.body.price,
      img: req.body.img,
    };

    const transportation = await Transportation.create(transportationData);

    res.status(201).json({
      success: true,
      data: transportation
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update transportation
// @route   PUT /api/v1/transportations/:id
// @access  Private/Admin

// @desc    Delete transportation
// @route   DELETE /api/v1/transportations/:id
// @access  Private/Admin