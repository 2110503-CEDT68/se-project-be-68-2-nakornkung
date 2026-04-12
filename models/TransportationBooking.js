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
        type: locationSchema,
        required: true
    },
    dropOffLocation: {
        type: locationSchema,
        required: true
    },
    departureDateTime: {
        type: Date,
        required: true
    },
    // passengerNumber: {
    //     type: Number,
    //     required: true,
    //     min: [1, 'Passenger number must be at least 1']
    // },
    returnDateTime: {
        type: Date,
    },
    // status: {
    //     type: String,
    //     enum: [pending , confirmed , cancelled],
    //     default: 'pending'
    // }
    bookingDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TransportationBooking',TransportationBookingSchema);