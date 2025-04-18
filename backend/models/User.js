const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["faculty", "admin", "viewer"], default: "faculty" },
  employeeId: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
