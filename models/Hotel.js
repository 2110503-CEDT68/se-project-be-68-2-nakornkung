const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  transportation: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Attraction'
  }],
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  tel: {
    type: String,
    required: [true, 'Please add a telephone number']
  },
  district: {
    type: String,
    required: [true, 'Please add a district'],
    trim: true
  },
  province: {
    type: String,
    required: [true, 'Please add a province'],
    trim: true
  },
  postalcode: {
    type: String,
    maxlength: [5, 'Postal code can not be more than 5 characters'],
    trim: true
  },
  img: {
    type: String,
    required: [true, 'Please add a picture'],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

HotelSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'hotel',
  justOne: false
});

module.exports = mongoose.model('Hotel', HotelSchema);
