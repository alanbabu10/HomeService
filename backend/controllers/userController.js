const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// User Register
const userRegister = async (req, res) => {
  try {
    const { name, email, password, contact, address, location } = req.body;
    
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      contact,
      address,
      location: location || { type: 'Point', coordinates: [0, 0] }
    });

    await newUser.save();
    res.status(200).json({ success: true, message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// User Login
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User Not Found" });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been blocked by an administrator" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const authToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      authToken,
      userId: user._id,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, contact, address, location } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = name || user.name;
    user.contact = contact || user.contact;
    user.address = address || user.address;
    if (location && location.coordinates) {
      user.location = {
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
      };
    }

    await user.save();
    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Forgot Password - Generate & Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User with this email does not exist" });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins expiry
    };

    await user.save();

    // Mock SMS / Email transmission: return in response for ease of development & verification
    res.json({
      success: true,
      message: `OTP sent successfully. Code: ${otpCode} (For testing/dev)`,
      otpCode // Returning this simplifies sandbox debugging
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp || user.otp.code !== otpCode || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }

    // Generate brief single-use token or just flag reset permissions
    user.resetPasswordToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = undefined; // clear otp
    await user.save();

    res.json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      resetToken: user.resetPasswordToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const user = await User.findOne({ email, resetPasswordToken: resetToken });

    if (!user || user.resetPasswordExpire < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired password reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. Please log in with your new credentials."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  userRegister,
  userLogin,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  verifyOTP,
  resetPassword
};
