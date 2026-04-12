const Transportation = require("../models/Transportation");
const TransportationBooking = require("../models/TransportationBooking");

exports.getTransportations = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`,
    );

    query = Transportation.find(JSON.parse(queryStr));

    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    //Pagination

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Transportation.countDocuments(JSON.parse(queryStr));

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
      data: transportations,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getTransportation = async (req,res,next)=>{
  try {
    const transportation = await Transportation.findById(req.params.id) ;

    if(!transportation) {
      return res.status(400).json({success:false});
    }
    res.status(200).json({success:true,data:transportation});
  } catch(err) {
    res.status(400).json({success:false});
  }
};

exports.createTransportation = async (req,res,next)=>{
  const transportation = await Transportation.create(req.body);
  res.status(201).json({success:true, data:transportation});
}

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
