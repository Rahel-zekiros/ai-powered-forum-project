import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the directory of the current JavaScript file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// It will contain the location where uploaded images should be saved
const uploadDir = path.join(__dirname, "../../../uploads");

// Create the upload folder if it does not already exist
fs.mkdirSync(uploadDir, { recursive: true });

const router = express.Router();

// Configure Multer to store uploaded images on the server
const storage = multer.diskStorage({
  // Save uploaded files inside the uploads folder
  destination: uploadDir,

  // Generate a unique filename while keeping the original extension
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, unique + path.extname(file.originalname));
  },
});

// Configure upload limits and allowed image types
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },

  // Allow only JPEG, PNG, and GIF images
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif"];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are supported."));
    }
  },
});

// Handle image upload requests
router.post("/", upload.single("image"), (req, res) => {
  // Return an error if no image was uploaded
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Create the URL that the frontend can use to access the uploaded image
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  // Return the image URL after successful upload
  res.status(201).json({ url });
});

export default router;
