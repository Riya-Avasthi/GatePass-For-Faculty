const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, employeeId, designation, department } = req.body;

    // Validate role
    if (!["admin", "faculty", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'admin', 'faculty', or 'viewer'." });
    }

    // Validate email format (lastname.firstname@kbtcoe.org)
    const emailRegex = /^[a-z]+\.[a-z]+@kbtcoe\.org$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email must be in format: lastname.firstname@kbtcoe.org" });
    }

    // Validate required fields based on role
    if (role !== 'viewer' && (!employeeId || !designation || !department)) {
      return res.status(400).json({ 
        message: "Employee ID, designation, and department are required for faculty and admin registration." 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Check if employee ID is unique (only for non-viewer roles)
    if (role !== 'viewer' && employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data based on role
    const userData = { 
      name, 
      email, 
      password: hashedPassword, 
      role
    };
    
    // Add additional fields only for faculty and admin roles
    if (role !== 'viewer') {
      userData.employeeId = employeeId;
      userData.designation = designation;
      userData.department = department;
    } else {
      // Set default values for viewer role to satisfy schema requirements
      userData.employeeId = 'N/A';
      userData.designation = 'Viewer';
      userData.department = 'Security';
    }
    
    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: `${role} Registered Successfully`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format (lastname.firstname@kbtcoe.org)
    const emailRegex = /^[a-z]+\.[a-z]+@kbtcoe\.org$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email must be in format: lastname.firstname@kbtcoe.org" });
    }
    
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Prepare user data to send back
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      designation: user.designation,
      department: user.department
    };

    // Determine the correct redirect URL based on user role
    let redirectUrl;
    if (user.role === "admin") {
      redirectUrl = "/admin-dashboard";
    } else if (user.role === "faculty") {
      redirectUrl = "/faculty-dashboard";
    } else if (user.role === "viewer") {
      redirectUrl = "/viewer-dashboard";
    } else {
      redirectUrl = "/dashboard";
    }

    res.json({
      token,
      user: userData,
      redirectUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT (Clearing Token)
router.post("/logout", async (req, res) => {
  try {
    res.json({ message: "Logged Out Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
