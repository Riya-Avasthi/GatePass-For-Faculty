const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const LeaveRequest = require("../models/LeaveRequest");

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

// Faculty middleware to check if user is faculty
const facultyMiddleware = (req, res, next) => {
  console.log("Faculty middleware - User role:", req.user.role);
  
  // Case-insensitive check
  if (!req.user.role || req.user.role.toLowerCase() !== 'faculty') {
    return res.status(403).json({ message: "Not authorized as faculty" });
  }
  next();
};

// Faculty submits leave request
router.post("/leave-request", authMiddleware, async (req, res) => {
  try {
    const { facultyId, facultyEmail, date, timeIn, timeOut, purpose, reason } = req.body;
    
    console.log("Leave request submission - Request body:", {
      facultyId,
      facultyEmail,
      date,
      userId: req.user.userId
    });
    
    // Validate userId from token matches the facultyId
    if (req.user.userId !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: User ID mismatch" });
    }
    
    // Convert facultyId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: "Invalid facultyId format" });
    }
    
    // Create ObjectId from facultyId
    const facultyObjectId = new mongoose.Types.ObjectId(facultyId);
    console.log("Converted facultyId to ObjectId:", facultyObjectId);
   
    const newRequest = new LeaveRequest({ 
      facultyId: facultyObjectId, 
      facultyEmail, 
      date, 
      timeIn, 
      timeOut, 
      purpose, 
      reason, 
      status: "pending" 
    });
    
    await newRequest.save();
    console.log("Leave request saved with ID:", newRequest._id);
    
    res.status(201).json({ message: "Leave request submitted successfully" });
  } catch (err) {
    console.error("Leave request error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get faculty's own leave requests
router.get("/my-requests", authMiddleware, facultyMiddleware, async (req, res) => {
  try {
    console.log("Faculty requesting their requests - User ID:", req.user.userId);
    
    // First try direct query with the token's userId as is
    const requestsWithOriginalId = await LeaveRequest.find({ facultyId: req.user.userId });
    console.log("Attempt 1 - Using original userId:", requestsWithOriginalId.length);
    
    // If found, return immediately
    if (requestsWithOriginalId.length > 0) {
      console.log("Found requests with original ID, returning");
      return res.status(200).json(requestsWithOriginalId);
    }
    
    // Try with ObjectId conversion if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.user.userId)) {
      const objectId = new mongoose.Types.ObjectId(req.user.userId);
      console.log("Converted to ObjectId:", objectId);
      
      const requestsWithObjectId = await LeaveRequest.find({ facultyId: objectId });
      console.log("Attempt 2 - Using ObjectId:", requestsWithObjectId.length);
      
      if (requestsWithObjectId.length > 0) {
        console.log("Found requests with ObjectId, returning");
        return res.status(200).json(requestsWithObjectId);
      }
    }
    
    // Check all leave requests and try string comparison as a last resort
    const allRequests = await LeaveRequest.find({});
    console.log("Total requests in database:", allRequests.length);
    
    if (allRequests.length > 0) {
      console.log("Sample request from database:", {
        id: allRequests[0]._id,
        facultyId: allRequests[0].facultyId,
        facultyEmail: allRequests[0].facultyEmail,
        idType: typeof allRequests[0].facultyId
      });
      
      // Try matching by string comparison
      const matchedByString = allRequests.filter(request => {
        if (!request.facultyId) return false;
        return request.facultyId.toString() === req.user.userId.toString();
      });
      
      if (matchedByString.length > 0) {
        console.log("Found requests by string comparison, returning");
        return res.status(200).json(matchedByString);
      }
      
      // Final try: check by facultyEmail
      const userEmail = req.user.email;
      console.log("Trying to match by email:", userEmail);
      
      if (userEmail) {
        const requestsByEmail = allRequests.filter(req => 
          req.facultyEmail === userEmail
        );
        
        if (requestsByEmail.length > 0) {
          console.log("Found requests by email, returning");
          return res.status(200).json(requestsByEmail);
        }
      }
    }
    
    // If we got here, no requests were found
    console.log("No requests found for this faculty member");
    return res.status(200).json([]);
  } catch (err) {
    console.error("Error fetching faculty requests:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


// // Faculty submits leave request
// router.post("/leave-request", authMiddleware, facultyMiddleware, async (req, res) => {
//     try {
//       const { facultyId, facultyEmail, date, timeIn, timeOut, purpose, reason } = req.body;
//       const newRequest = new LeaveRequest({ facultyId, facultyEmail, date, timeIn, timeOut, purpose, reason, status: "pending" });
//       await newRequest.save();
//       res.status(201).json({ message: "Leave request submitted successfully" });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });
  
//   module.exports = router;