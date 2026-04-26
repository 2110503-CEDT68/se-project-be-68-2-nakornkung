const Transportation = require('../models/Transportation');
const TransportationBooking = require('../models/TransportationBooking');

exports.getTransportations = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit', 'province', 'search'];
    
    const searchTerm = reqQuery.search ? reqQuery.search.trim() : null;
    const province = reqQuery.province ? reqQuery.province.trim() : null;
    
    removeFields.forEach(param => delete reqQuery[param]);
 
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,
      match => `$${match}`);
    let filters = JSON.parse(queryStr);
 
    // Handle search - regex match in name or providerName
    if (searchTerm) {
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      filters.$or = [
        { name: searchRegex },
        { providerName: searchRegex }
      ];
    }
 
    if (province) {
      const provinceRegex = new RegExp(`^${province}$`, 'i');
      const provinceFilters = [
        { 'pickUpArea.address.province': provinceRegex },  
        { 'dropOffArea.address.province': provinceRegex }  
      ];
      
      if (filters.$or) {
        filters = {
          $and: [
            { $or: filters.$or },
            { $or: provinceFilters }
          ]
        };
      } else {
        filters.$or = provinceFilters;
      }
    }
 
    query = Transportation.find(filters);

    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    if (req.query.sort) {
      const fields = req.query.sort.split(',').join(' ');
      query = query.sort(fields);
    } else {
      query = query.sort('-createdAt'); 
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
      pagination.next = { page: page + 1, limit };
    }

    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
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
exports.updateTransportation = async (req,res,next)=>{
  try {
    const transportation = await Transportation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }) ;
    if(!transportation) {
      return res.status(400).json({success:false}) ;
    }
    res.status(200).json({success:true, data:transportation});
  } catch(err) {
    res.status(400).json({success:false}) ;
  }
}

// @desc    Delete transportation
// @route   DELETE /api/v1/transportations/:id
// @access  Private/Admin
exports.deleteTransportation = async (req,res,next)=>{
  try {
    const transportation = await Transportation.findById(req.params.id);

    if(!transportation){
      return res.status(400).json({success:false, message:`Transportation not found with id of ${req.params.id}`})
    }
    await TransportationBooking.deleteMany({transportation:req.params.id});
    await Transportation.deleteOne({_id:req.params.id});
  
    res.status(200).json({success:true,data:{}});
  } catch(err) {
    res.status(400).json({success:false}) ;
  }
}
