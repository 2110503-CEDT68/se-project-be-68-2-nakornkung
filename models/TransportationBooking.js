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

const TransportationBookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // booking: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Booking',
    //     required: true
    // },
    transportation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transportation',
        required: true
    },
    pickupLocation: {
        type: 
    }
});

module.exports = mongoose.model('TransportationBooking',TransportationBookingSchema);