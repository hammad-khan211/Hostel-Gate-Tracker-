const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  name: String,
  person_id: String,
  room_no: String,
  block: String,
  purpose: String,
  status: String,
  time_in: Date,
  time_out: Date
});

module.exports = mongoose.model("Entry", entrySchema);
