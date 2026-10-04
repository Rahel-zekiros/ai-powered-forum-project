import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend/src/api/uploads -> up 3 levels -> backend/uploads
const uploadDir = path.join(__dirname, "../../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const router = express.Router();

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // match the frontend's 2 MiB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif"];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are supported."));
    }
  },
});
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

export default router;
