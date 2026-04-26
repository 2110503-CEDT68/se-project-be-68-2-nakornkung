const Attraction = require('../models/Attraction');

// @desc    Get all attractions
// @route   GET /api/v1/attractions
// @access  Public
exports.getAttractions = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    const searchableFields = ['name'];

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

    query = Attraction.find(filters);

    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    if (req.query.sort) {
      const fields = req.query.sort.split(',').join(' ');
      query = query.sort(fields);
    }
    else {
      query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Attraction.countDocuments(filters);

    query = query.skip(startIndex).limit(limit);

    const attractions = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = { page: page + 1, limit }
    }

    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit }
    }

    res.status(200).json({
      success: true,
      count: attractions.length,
      total,
      pagination,
      data: attractions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single attraction
// @route   GET /api/v1/attractions/:id
// @access  Public
exports.getAttraction = async (req, res, next) => {
  try {
    const attraction = await Attraction.findById(req.params.id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: `Attraction not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({ success: true, data: attraction });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};


// @desc    Create new attraction
// @route   POST /api/v1/attractions
// @access  Private/Admin
exports.createAttraction= async (req,res,next)=>{
    try {
        const attraction = await Attraction.create(req.body) ;
        res.status(201).json({success:true, data:attraction}) ;
    } catch(err) {
        res.status(400).json({success:false, message: err.message}) ;
    }
} ;


// @desc    Update attraction
// @route   PUT /api/v1/attractions/:id
// @access  Private/Admin
exports.updateAttraction= async(req,res,next)=>{
    try {
        const attraction = await Attraction.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true 
        }) ;

        if(!attraction) {
            return res.status(400).json({success:false, message: 'Attraction not found'}) ;
        }
        res.status(200).json({success:true, data:attraction}) ;
    } catch(err) {
        res.status(400).json({success:false, message: err.message}) ;
    }

} ;


// @desc    Delete attraction
// @route   DELETE /api/v1/attractions/:id
// @access  Private/Admin
exports.deleteAttraction = async (req, res, next) => {
  try {

    const attraction = await Attraction.findById(req.params.id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: `Attraction not found with id of ${req.params.id}`
      });
    }

    await Attraction.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, data: {} });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
