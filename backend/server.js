const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Entry = require("./entryModel");

// -------- Add these new lines --------
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Guard = require("./guardModel");
const auth = require("./auth");
const SECRET_KEY = "secret123";
// -------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect("mongodb://localhost:27017/gatetracker")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));


// -------- Guard Auth Routes (paste here) --------
app.post("/signup", async (req, res) => {
  console.log("Signup hit"); // Debugging

  const { username, password } = req.body;
  console.log("Received:", req.body); // Debugging

  try {
    const hashedPass = await bcrypt.hash(password, 10);
    console.log("Password hashed");

    const guard = new Guard({ username, password: hashedPass });
    await guard.save();
    console.log("Saved to DB");

    res.send({ message: "Guard created successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ message: "Error occurred", error: err.message });
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const guard = await Guard.findOne({ username });
  if (!guard) return res.status(400).send({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, guard.password);
  if (!isMatch) return res.status(400).send({ message: "Invalid password" });

  const token = jwt.sign({ id: guard._id }, SECRET_KEY, { expiresIn: "1d" });

  res.send({ message: "Login successful", token });
});
// ------------------------------------------------


// -------- Protect Entry System Routes --------
app.post("/entry", auth, async (req, res) => {
  const data = new Entry({
    ...req.body,
    status: "OUT",
    time_out: new Date()    // set time_out when entry is created
  });

  await data.save();
  res.send({ message: "Entry Added" });
});


app.put("/exit/:id", auth, async (req, res) => {
  await Entry.findByIdAndUpdate(req.params.id, {
    status: "IN",
    time_in: new Date()
  });

  res.send({ message: "Marked IN" });
});


app.get("/logs", auth, async (req, res) => {
  const logs = await Entry.find();
  res.json(logs);
});
// ----------------------------------------------


// Server listening
app.listen(4000, () => console.log("Server running on port 4000"));

