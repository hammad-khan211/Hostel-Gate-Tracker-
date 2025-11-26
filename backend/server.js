
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Entry = require("./entryModel");
const Guard = require("./guardModel");
const auth = require("./auth");
require("dotenv").config();   // <--- Add this

const SECRET_KEY = process.env.SECRET_KEY || "secret123";

const app = express();
app.use(express.json());

// CORS setup
app.use(cors({
  origin: [
    "https://hostel-gate-tracker.netlify.app",   // frontend hosted URL
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));

// Allow preflight requests
app.options("*", cors());



// DB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => console.log("DB Error:", err));


// -------- Guard Auth Routes --------
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await Guard.findOne({ username });
    if (existing) return res.status(400).send({ message: "User already exists" });

    const hashedPass = await bcrypt.hash(password, 10);
    const guard = new Guard({ username, password: hashedPass });
    await guard.save();

    res.send({ message: "Guard created successfully" });
  } catch (err) {
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


// -------- Entry System --------
app.post("/entry", auth, async (req, res) => {
  const data = new Entry({
    ...req.body,
    status: "OUT",
    time_out: new Date()
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

// DELETE ALL LOGS
app.delete("/clear-logs", async (req, res) => {
  try {
    await Entry.deleteMany({});
    res.send({ message: "All logs cleared successfully" });
  } catch (err) {
    res.status(500).send({ message: "Error clearing logs" });
  }
});




// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

