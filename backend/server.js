console.log(">>> Running CORRECT backend server.js");

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

// EXPORT LOGS AS CSV
app.get("/export-csv", auth, async (req, res) => {
  try {
    const logs = await Entry.find().lean();

    if (!logs.length) {
      return res.status(404).send({ message: "No logs found to export" });
    }

    // Extract headers
    const keys = Object.keys(logs[0]);
    const header = keys.join(",") + "\n";

    // Convert each log entry to CSV row
    const rows = logs.map(obj => {
      return keys.map(key => JSON.stringify(obj[key] ?? "")).join(",");
    }).join("\n");

    const csvData = header + rows;

    // Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=hostel_logs.csv");

    res.send(csvData);
  } catch (err) {
    console.error("CSV Export Error:", err);
    res.status(500).send({ message: "Error exporting logs" });
  }
});


const PDFDocument = require("pdfkit");

// EXPORT LOGS AS PDF
app.get("/export-pdf", auth, async (req, res) => {
  try {
    const logs = await Entry.find().lean();

    if (!logs.length) {
      return res.status(404).send({ message: "No logs available to export" });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    let filename = "hostel_logs.pdf";
    filename = encodeURIComponent(filename);

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Hostel Gate Entry Logs", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text("Generated at: " + new Date().toLocaleString());
    doc.moveDown();

    // Table header
    const tableTop = 140;
    const cellSpacing = 20;

    doc.fontSize(12).text("Name", 40, tableTop);
    doc.text("Room", 150, tableTop);
    doc.text("Status", 220, tableTop);
    doc.text("Time Out", 300, tableTop);
    doc.text("Time In", 430, tableTop);

    let y = tableTop + 20;

    // Table rows
    logs.forEach(log => {
      doc.text(log.name || "", 40, y);
      doc.text(log.room || "", 150, y);
      doc.text(log.status || "", 220, y);
      doc.text(log.time_out ? new Date(log.time_out).toLocaleString() : "-", 300, y);
      doc.text(log.time_in ? new Date(log.time_in).toLocaleString() : "-", 430, y);
      y += cellSpacing;

      // Page break if needed
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
    });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).send({ message: "Error generating PDF" });
  }
});




//Test Route
app.get("/test-route", (req, res) => {
  res.send("Test route working");
});





// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

