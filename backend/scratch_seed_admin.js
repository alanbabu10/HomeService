const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
require("dotenv").config();

const seedAdmin = async () => {
  const primaryURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/home_service";
  try {
    await mongoose.connect(primaryURI);
    console.log("Connected to MongoDB for admin seeding...");

    const email = "admin@homeservice.com";
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("Admin user already exists. Updating role to admin...");
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Admin updated successfully!");
    } else {
      console.log("Creating new default admin user...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("AdminPassword123", salt);

      const newAdmin = new User({
        name: "System Administrator",
        email,
        password: hashedPassword,
        contact: "1234567890",
        address: "HQ Command Center",
        role: "admin",
        location: { type: "Point", coordinates: [0, 0] }
      });

      await newAdmin.save();
      console.log("New admin user seeded successfully!");
    }
  } catch (err) {
    console.error("Failed to seed admin:", err.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
