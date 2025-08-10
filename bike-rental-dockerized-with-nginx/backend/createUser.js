require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const newUser = new User({
    firstName: 'raanan',
    lastName: 'peretz',
    email: 'rananpAdmin@gmail.com',
    password: '1234', // plain text, will be hashed automatically
    role: 'admin'
  });

  await newUser.save();
  console.log('✅ Admin user created!');
  process.exit();
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});