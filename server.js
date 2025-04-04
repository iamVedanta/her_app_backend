require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Mongoose Schema
const ReportSchema = new mongoose.Schema({
  name: String,
  photoUrl: String,
  location: { latitude: Number, longitude: Number },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", ReportSchema);

// API to Submit Report
app.post("/submit-report", upload.single("photo"), async (req, res) => {
  try {
    const { name, latitude, longitude, description } = req.body;
    const photoUrl = req.file ? req.file.path : null;

    const reportData = new Report({
      name,
      photoUrl,
      location: { latitude, longitude },
      description,
    });

    await reportData.save();
    res
      .status(201)
      .json({ message: "Report submitted successfully!", data: reportData });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
