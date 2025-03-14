const express = require("express");
const multer = require("multer");
const path = require("path");
const wallpaper = require("wallpaper");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const uniqueName = `wallpaper_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// API to get the current wallpaper
app.get("/current-wallpaper", async (req, res) => {
    try {
        const wallpaperPath = await wallpaper.getWallpaper();
        const fileName = path.basename(wallpaperPath);
        const localFilePath = path.join(uploadDir, fileName);

        // If the wallpaper is not in the uploads folder, copy it
        if (!fs.existsSync(localFilePath)) {
            fs.copyFileSync(wallpaperPath, localFilePath);
        }

        res.json({ wallpaper: `http://localhost:${PORT}/uploads/${fileName}` });
    } catch (error) {
        console.error("Error getting wallpaper:", error);
        res.status(500).json({ error: "Failed to get wallpaper" });
    }
});


app.post("/upload", upload.single("wallpaper"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const filePath = path.join(uploadDir, req.file.filename);

        // Check if file already exists
        if (fs.existsSync(filePath)) {
            console.log("File already exists, setting as wallpaper:", filePath);
            await wallpaper.set(filePath); 
            return res.json({ success: true, message: "Wallpaper changed!", file: `/uploads/${req.file.filename}` });
        }
        await wallpaper.set(filePath);
        res.json({ success: true, message: "Wallpaper changed!", file: `/uploads/${req.file.filename}` });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: "Failed to change wallpaper", error });
    }
});
app.get("/list-wallpapers", async (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        const images = files.map(file => `http://localhost:${PORT}/uploads/${file}`);
        res.json({ images });
    } catch (error) {
        res.status(500).json({ error: "Failed to list wallpapers" });
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

        await wallpaper.setWallpaper(filePath); 


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
