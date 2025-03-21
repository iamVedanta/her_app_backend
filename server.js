require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static("uploads"));

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Multer Storage Setup for File Uploads
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
const FormSchema = new mongoose.Schema({
  name: String,
  photos: [String],
  location: { latitude: Number, longitude: Number },
  description: String,
});

const Form = mongoose.model("Form", FormSchema);

// Route to Handle Form Submission
app.post("/submit", upload.array("photos", 5), async (req, res) => {
  try {
    const { name, latitude, longitude, description } = req.body;
    const photos = req.files.map((file) => file.path);

    const formData = new Form({
      name,
      photos,
      location: { latitude, longitude },
      description,
    });

    await formData.save();
    res
      .status(201)
      .json({ message: "Form submitted successfully!", data: formData });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit form" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
