const Employee = require("../models/employeModel");
const Attendance = require("../models/attendanceModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Employee / Handyman
const employeeRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateofbirth,
      gender,
      description,
      location,
      address,
      contact,
      service,
    } = req.body;

    const existEmployee = await Employee.findOne({ email });
    if (existEmployee) {
      return res.status(400).json({ success: false, message: "Employee already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      dateofbirth,
      gender,
      description,
      location: location || { type: 'Point', coordinates: [0, 0] },
      address,
      contact,
      service,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for admin approval.",
      employee: newEmployee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login Employee
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!employee.approveStatus) {
      return res.status(403).json({
        success: false,
        message: "Waiting for admin approval",
      });
    }

    const authToken = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      authToken,
      userId: employee._id,
      role: employee.role,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Employees (Admin)
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate("service", "title");
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve Handyman (Admin)
const approveEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    employee.approveStatus = true;
    await employee.save();

    res.json({
      success: true,
      message: "Employee Approved",
      employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Find Handymen by Service ID
const getEmployeesByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const employees = await Employee.find({
      service: serviceId,
      approveStatus: true,
    });
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Online/Offline Availability
const toggleAvailability = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    employee.isAvailable = !employee.isAvailable;
    await employee.save();

    res.json({ success: true, message: `Availability status set to ${employee.isAvailable}`, isAvailable: employee.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clock Attendance Check-In / Check-Out
const clockAttendance = async (req, res) => {
  try {
    const { action } = req.body; // "checkin" or "checkout"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (action === "checkin") {
      // Check if already checked in today
      const exist = await Attendance.findOne({ employee: req.user._id, date: today });
      if (exist) {
        return res.status(400).json({ success: false, message: "Already checked in today" });
      }

      const att = await Attendance.create({
        employee: req.user._id,
        date: today,
        checkIn: new Date(),
        status: "present"
      });

      await Employee.findByIdAndUpdate(req.user._id, { attendanceStatus: "online" });
      return res.json({ success: true, message: "Checked in successfully", attendance: att });
    } else if (action === "checkout") {
      const att = await Attendance.findOne({ employee: req.user._id, date: today });
      if (!att) {
        return res.status(400).json({ success: false, message: "No check-in found for today" });
      }

      att.checkOut = new Date();
      const diffMs = att.checkOut - att.checkIn;
      att.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // decimal hours
      await att.save();

      await Employee.findByIdAndUpdate(req.user._id, { attendanceStatus: "offline" });
      return res.json({ success: true, message: "Checked out successfully", attendance: att });
    }

    res.status(400).json({ success: false, message: "Invalid action" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Document for KYC Verification
const updateKycDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file uploaded" });
    }

    // Save relative URL of uploaded document
    const fileUrl = `/uploads/${req.file.filename}`;
    const employee = await Employee.findByIdAndUpdate(
      req.user._id,
      {
        kycDocument: {
          status: "pending",
          fileUrl
        }
      },
      { new: true }
    );

    res.json({ success: true, message: "KYC document uploaded successfully. Waiting for admin approval.", employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Handyman Profile Details
const getHandymanProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id).select("-password").populate("service");
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  employeeRegister,
  employeeLogin,
  getAllEmployees,
  approveEmployee,
  getEmployeesByService,
  toggleAvailability,
  clockAttendance,
  updateKycDocument,
  getHandymanProfile
};