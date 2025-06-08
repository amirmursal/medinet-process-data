const express = require("express");
const multer = require("multer");
const cors = require("cors");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://amirmursal:86hsLIgmzfAGOHG8@cluster0.zggifub.mongodb.net/medinet?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected to medinet database"))
  .catch((err) => console.error("MongoDB connection error:", err));

const dataSchema = new mongoose.Schema({}, { strict: false });
const XLSData = mongoose.model("medinetprocesses", dataSchema);

// Set up file storage
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const range = xlsx.utils.decode_range(worksheet["!ref"]);
    const headers = [];
    const data = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = xlsx.utils.encode_cell({ r: range.s.r, c: col });
      const headerValue = worksheet[headerCell]
        ? worksheet[headerCell].v
        : `Column ${col + 1}`;
      headers.push(headerValue.replace(/\s+/g, "_")); // Replace spaces with underscores
    }

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const rowData = {};
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
        rowData[headers[col - range.s.c]] = worksheet[cellAddress]
          ? worksheet[cellAddress].v
          : "";
      }
      data.push(rowData);
    }

    fs.unlinkSync(filePath); // Delete uploaded file after processing

    // Store data in MongoDB
    await XLSData.insertMany(data);

    res.json({ message: "File uploaded and data stored successfully" });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/search", async (req, res) => {
  try {
    const searchQuery = req.body.search || {};
    const data = await XLSData.find(searchQuery);
    res.json({ message: "Data fetched successfully", data });
  } catch (err) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.delete("/delete", async (req, res) => {
  try {
    await XLSData.deleteOne({ _id: req.body.id });
    res.json({ message: "record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting data" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
