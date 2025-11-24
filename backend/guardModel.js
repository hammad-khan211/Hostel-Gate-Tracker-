const mongoose = require("mongoose");

const GuardSchema = new mongoose.Schema({
  username: String,
  password: String
});

module.exports = mongoose.model("Guard", GuardSchema);
