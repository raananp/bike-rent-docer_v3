const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const routes = require('./routes');
const bookingRoutes = require('./routes/bookings');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use('/', routes);
app.use('/api/bookings', bookingRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
