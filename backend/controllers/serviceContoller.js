const Service = require("../models/serviceModel");

// ---------------- ADD SERVICE ----------------
const addService = async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || !price) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existing = await Service.findOne({ title });
    if (existing) {
      return res.status(400).json({
        message: "Service already exists",
      });
    }

    const service = await Service.create({
      title,
      description,
      price,
    });

    res.status(201).json({
      message: "Service added successfully",
      service,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET SERVICES ----------------
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addService, getAllServices };