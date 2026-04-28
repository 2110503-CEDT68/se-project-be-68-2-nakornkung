const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  province: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: addressSchema,
    required: true
  }
}, { _id: false });

const TransportationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'Please add transportation name'],
        unique: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['car', 'airplane', 'boat', 'bus', 'van' , 'shuttle'],
        required: [true,'Please add transportation type']
    },
    providerName: {
        type: String,
        required: [true,'Please add transportation providerName']
    },
    pickUpArea: {
        type: locationSchema,
        required: true
    },
    dropOffArea: {
        type: locationSchema,
        required: true
    },
    price: {
        type: Number,
        required: [true,'Please add transportation price'],
        min: 0
    },
    img: {
        type: String,
        required: [true,'Please add transportation img']
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}); 

module.exports = mongoose.model('Transportation',TransportationSchema);