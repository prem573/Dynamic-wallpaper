const express = require("express");
const path = require("path");
const wallpaper = require("wallpaper");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;
const uploadDir = path.join(__dirname, "uploads"); 

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function deleteAllFiles(directory) {
    try {
        const files = await fs.promises.readdir(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isFile()) {
                await fs.promises.unlink(filePath);
                console.log(`Deleted: ${filePath}`);
            }
        }
    } catch (error) {
        console.error("Error deleting files:", error);
    }
}

async function downloadImage(imageUrl) {
    try {
        await deleteAllFiles(uploadDir); 

        const fileName = "wallpaper.jpg"; 
        const savePath = path.join(uploadDir, fileName);

        const response = await axios({
            url: imageUrl,
            responseType: "stream",
        });

        const writer = fs.createWriteStream(savePath);
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", () => resolve(savePath)); 
            writer.on("error", (error) => reject(error));
        });
    } catch (error) {
        console.error("Error downloading image:", error);
        return null;
    }
}
app.get("/current-wallpaper", async (req, res) => {
    try {
        const wallpaperPath = await wallpaper.getWallpaper();
        console.log("Current wallpaper:", wallpaperPath);   
        const fileName = path.basename(wallpaperPath);
        const localFilePath = path.join(uploadDir, fileName);
        res.json({ wallpaper: `http://localhost:${PORT}/uploads/${fileName}` });
    } catch (error) {
        console.error("Error getting wallpaper:", error);
        res.status(500).json({ error: "Failed to get wallpaper" });
    }
});
app.post("/set-wallpaper", async (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ success: false, message: "Filename is required" });
        }

        const imgUrl = `https://premchand.tech/wallpaper/uploads/${filename}`;
        const filePath = await downloadImage(imgUrl);
        if (!filePath) {
            return res.status(500).json({ success: false, message: "Failed to download image" });
        }

        await wallpaper.setWallpaper(filePath);
        console.log("Wallpaper changed successfully!");

        res.json({ success: true, message: "Wallpaper changed!", file: `/uploads/wallpaper.jpg` });
    } catch (error) {
        console.error("Set Wallpaper Error:", error);
        res.status(500).json({ success: false, message: "Failed to set wallpaper", error });
    }
});

// Serve uploaded images
app.use("/uploads", express.static(uploadDir));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
