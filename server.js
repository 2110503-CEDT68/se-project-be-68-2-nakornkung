// const { setServers } = require("node:dns/promises");
// setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

//load env
dotenv.config()

//connect db
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

const app = express();

//Route files
const hotels = require('./routes/hotels')
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');

const transportations = require('./routes/transportations')
const transportationBookings = require('./routes/transportationBookings')

//Query Parser
app.set('query parser', 'extended');

//Body parser
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//Mount routers
app.use('/api/v1/hotels', hotels);
app.use('/api/v1/transportations', transportations);
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/transportations',transportations);
app.use('/api/v1/transportationBookings',transportationBookings);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unhanded promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error:${err.message}`);
  //close server & exit process
  server.close(() => process.exit(1));
});
