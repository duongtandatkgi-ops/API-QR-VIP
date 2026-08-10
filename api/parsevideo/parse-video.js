const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

const app = express();
app.use(express.json());

app.get("/api/parse-video", async (req, res) => {
    // Cấu hình CORS để Roblox không bị chặn
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const mediaUrl = req.query.url;
    const width = parseInt(req.query.w) || 24;
    const height = parseInt(req.query.h) || 24;

    if (!mediaUrl) {
        return res.status(400).json({ error: "Thiếu tham số 'url'!" });
    }

    try {
        // Tải file dữ liệu từ URL Catbox / Discord
        const response = await axios.get(mediaUrl, { 
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const buffer = Buffer.from(response.data);

        // Đọc dữ liệu qua Canvas
        const img = await loadImage(buffer);
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        const frameData = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                const alpha = pixels[index + 3];

                if (alpha > 30) {
                    frameData.push({
                        x: x + 1,
                        y: y + 1,
                        r: r,
                        g: g,
                        b: b
                    });
                }
            }
        }

        return res.json({
            success: true,
            width: width,
            height: height,
            totalFrames: 1,
            frames: [frameData]
        });

    } catch (error) {
        // Nếu file gửi lên là MP4 (chưa thể parse trực tiếp qua canvas đơn thuần)
        return res.status(500).json({
            error: "Lỗi tải hoặc giải mã URL!",
            details: error.message
        });
    }
});

module.exports = app;
