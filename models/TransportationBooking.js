const mongoose = require('mongoose');

const TransportationBookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    transportation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transportation',
        required: true
    },
    departureDateTime: {
        type: Date,
        required: true
    },
    passengerNumber: {
        type: Number,
        required: true,
        min: [1, 'Passenger number must be at least 1']
    },
    returnDateTime: {
        type: Date,
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TransportationBooking',TransportationBookingSchema);