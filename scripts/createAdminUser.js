// Run this script once to create the default admin user
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://bilalrafiq1975:KROnGS6EEO8u26yh@cluster0.vpbvtvp.mongodb.net/dpl_receptionist_db?retryWrites=true&w=majority&appName=Cluster0";

async function createAdmin() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const exists = await User.findOne({ username: 'admin' });
  if (exists) {
    console.log('Admin user already exists.');
    process.exit(0);
  }
  const user = new User({ username: 'admin', password: 'admin123' });
  await user.save();
  console.log('Admin user created: username=admin, password=admin123');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
