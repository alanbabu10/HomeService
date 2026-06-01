const mongoose = require('mongoose');

const seedData = async () => {
  try {
    const Category = require('../models/categoryModel');
    const Service = require('../models/serviceModel');

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log("Seeding default categories...");
      const plumbingCat = await Category.create({
        name: "Plumbing",
        icon: "wrench",
        description: "Bathroom leak fixes, pipe replacements, and tap repairs."
      });
      const electricalCat = await Category.create({
        name: "Electrical",
        icon: "bolt",
        description: "Circuit board repairs, wire diagnostics, and light fixtures."
      });
      const cleaningCat = await Category.create({
        name: "Cleaning",
        icon: "sparkles",
        description: "Full home sanitizing, deep dusting, and carpet washes."
      });

      const serviceCount = await Service.countDocuments();
      if (serviceCount === 0) {
        console.log("Seeding default services...");
        await Service.create([
          {
            title: "Premium Plumbing Repair",
            description: "Full bathroom leak repair, tap installation, and pipe fixtures.",
            price: 80,
            category: plumbingCat._id
          },
          {
            title: "Electrical Fixture Care",
            description: "Professional installation and diagnostics of electrical appliances.",
            price: 95,
            category: electricalCat._id
          },
          {
            title: "Complete Home Deep Clean",
            description: "Thorough deep cleaning of kitchen, living room, and bedrooms.",
            price: 60,
            category: cleaningCat._id
          }
        ]);
      }
      console.log("Database auto-seeding completed!");
    } else {
      const serviceCount = await Service.countDocuments();
      if (serviceCount === 0) {
        console.log("Seeding default services...");
        await Service.create([
          {
            title: "Premium Plumbing Repair",
            description: "Full bathroom leak repair, tap installation, and pipe fixtures.",
            price: 80
          },
          {
            title: "Electrical Fixture Care",
            description: "Professional installation and diagnostics of electrical appliances.",
            price: 95
          },
          {
            title: "Complete Home Deep Clean",
            description: "Thorough deep cleaning of kitchen, living room, and bedrooms.",
            price: 60
          }
        ]);
        console.log("Services auto-seeding completed!");
      }
    }
  } catch (error) {
    console.error("Failed to seed database:", error.message);
  }
};

const connectDB = async () => {
  const primaryURI = process.env.MONGO_URI;
  const fallbackURI = "mongodb://127.0.0.1:27017/home_service";

  try {
    await mongoose.connect(primaryURI);
    console.log("Database connected successfully to primary Atlas URI");
    await seedData();
  } catch (error) {
    console.warn("Primary Atlas connection failed. Trying local fallback connection...", error.message);
    try {
      await mongoose.connect(fallbackURI);
      console.log("Database connected successfully to local MongoDB instance");
      await seedData();
    } catch (fallbackError) {
      console.error("Local MongoDB connection also failed. Please check if your MongoDB service is running.", fallbackError.message);
    }
  }
};

module.exports = connectDB;