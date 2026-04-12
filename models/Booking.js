const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  checkInDate: {
    type: Date,
    required: [true, 'Please specify check-in date']
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Please specify check-out date']
  },
  transportation: [{
    type: mongoose.Schema.ObjectId,
    ref: 'TransportationBooking'
  }],
  numberOfNights: {
    type: Number,
    min: 1,
    max: 3
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  hotel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
});

BookingSchema.pre('save', function () {
  if (this.checkInDate && this.checkOutDate) {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    this.numberOfNights = nights;
  }
});

BookingSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();

  if (update.checkInDate && update.checkOutDate) {
    const checkIn = new Date(update.checkInDate);
    const checkOut = new Date(update.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    update.numberOfNights = nights;
  }
});

module.exports = mongoose.model('Booking', BookingSchema);