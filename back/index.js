const express = require("express");
const multer = require("multer");
const path = require("path");
const wallpaper = require("wallpaper");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const app = express();
const PORT = 5000;
const uploadDir = path.join(__dirname, "uploads"); 
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/current-wallpaper", async (req, res) => {
    try {
        const wallpaperPath = await wallpaper.get();
        const fileName = path.basename(wallpaperPath);
        const localFilePath = path.join(uploadDir, fileName);

        if (!fs.existsSync(localFilePath)) {
            fs.copyFileSync(wallpaperPath, localFilePath);
        }

        res.json({ wallpaper: `http://localhost:${PORT}/uploads/${fileName}` });
    } catch (error) {
        console.error("Error getting wallpaper:", error);
        res.status(500).json({ error: "Failed to get wallpaper" });
    }
});

const upload = multer({ dest: "uploads/" }); 

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path), req.file.originalname);
    const phpResponse = await axios.post("https://your-php-api.com/upload.php", formData, {
      headers: formData.getHeaders(),
    });
    fs.unlinkSync(req.file.path);
    res.json({ success: true, response: phpResponse.data });
  } catch (error) {
    console.error("Error forwarding image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.post("/set-wallpaper", async (req, res) => {
    try {
        console.log("Received body:", req.body);
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({ success: false, message: "Filename is required" });
        }

        const filePath = path.join(uploadDir, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        // await wallpaper.set(filePath);

        res.json({ success: true, message: "Wallpaper changed!", file: `/uploads/${filename}` });
    } catch (error) {
        console.error("Set Wallpaper Error:", error);
        res.status(500).json({ success: false, message: "Failed to set wallpaper", error });
    }
});

app.use("/uploads", express.static(uploadDir));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
