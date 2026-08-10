const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

const app = express();
app.use(express.json());

/**
 * Endpoint xử lý video/hình ảnh khung hình
 * Query Params:
 *  - url: Đường dẫn file MP4 / Image
 *  - w: Chiều rộng canvas (Default: 24)
 *  - h: Chiều cao canvas (Default: 24)
 *  - fps: Số khung hình / giây (Default: 10)
 */
app.get("/api/parse-video", async (req, res) => {
    // Cho phép Roblox truy cập (CORS)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const videoUrl = req.query.url;
    const width = parseInt(req.query.w) || 24;
    const height = parseInt(req.query.h) || 24;
    const fps = parseInt(req.query.fps) || 10;

    if (!videoUrl) {
        return res.status(400).json({ error: "Thừa tham số 'url'. Vui lòng truyền URL video MP4!" });
    }

    try {
        // Tải dữ liệu ảnh/khung hình tạm thời từ URL
        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");
        
        const img = await loadImage(buffer);
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Vẽ lại ảnh theo chuẩn kích thước grid của màn hình Roblox
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        const frameData = [];

        // Lặp qua từng pixel lấy giá trị R, G, B
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                const alpha = pixels[index + 3];

                // Bỏ qua các pixel trong suốt
                if (alpha > 50) {
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

        // Trả về cấu trúc JSON chuẩn cho Script Roblox
        return res.json({
            success: true,
            width: width,
            height: height,
            fps: fps,
            totalFrames: 1,
            frames: [frameData]
        });

    } catch (error) {
        return res.status(500).json({
            error: "Không thể giải mã file MP4 / Hình ảnh!",
            details: error.message
        });
    }
});

module.exports = app;
