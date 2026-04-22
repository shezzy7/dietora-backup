// src/seeders/adminSeeder.js
// Creates the initial admin account
// Run: npm run seed:admin

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const connectDB = require('../config/database');

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'admin@dietora.pk';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const name = 'DIETORA Admin';

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`\n⚠️  Admin already exists: ${email}`);
      process.exit(0);
    }

    // Create admin user
    const user = await User.create({ name, email, password, role: 'admin' });

    // Create admin record
    await Admin.create({
      user: user._id,
      permissions: ['manage_foods', 'manage_users', 'view_feedback', 'view_analytics'],
    });

    console.log(`\n✅ Admin account created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Please change the default password after first login!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Admin seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
