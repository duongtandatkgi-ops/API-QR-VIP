const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs");
const path = require("path");

// Cấu hình đường dẫn FFmpeg cho Vercel
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
app.use(express.json());

app.get("/api/parse-video", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const mediaUrl = req.query.url;
    const width = parseInt(req.query.w) || 24;
    const height = parseInt(req.query.h) || 24;
    const fps = parseInt(req.query.fps) || 10;

    if (!mediaUrl) {
        return res.status(400).json({ error: "Thiếu tham số 'url'!" });
    }

    // Tạo thư mục tạm trên Vercel để chứa video và frames
    const tmpDir = path.join('/tmp', `video_${Date.now()}`);
    const videoPath = path.join(tmpDir, 'input.mp4');
    const framesDir = path.join(tmpDir, 'frames');

    try {
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.mkdirSync(framesDir, { recursive: true });

        // 1. Tải video từ Catbox/Discord về Vercel
        const response = await axios.get(mediaUrl, { 
            responseType: "stream",
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 2. Dùng FFmpeg cắt video thành từng frame (.png)
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .fps(fps)
                .size(`${width}x${height}`)
                .output(path.join(framesDir, 'frame-%03d.png'))
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 3. Đọc các frame đã cắt và lấy tọa độ RGB
        const files = fs.readdirSync(framesDir).sort();
        const allFramesData = [];
        
        // GIỚI HẠN: Vercel Free chỉ chạy tối đa 10s, nên mình giới hạn xử lý 40 frames đầu tiên
        // (tương đương 4 giây video nếu để 10 fps) để tránh bị văng lỗi Timeout.
        const maxFrames = Math.min(files.length, 40); 
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < maxFrames; i++) {
            const imgPath = path.join(framesDir, files[i]);
            const img = await loadImage(imgPath);
            
            ctx.drawImage(img, 0, 0, width, height);
            const imgData = ctx.getImageData(0, 0, width, height);
            const pixels = imgData.data;

            const frameData = [];
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const alpha = pixels[index + 3];

                    if (alpha > 30) {
                        frameData.push({
                            x: x + 1,
                            y: y + 1,
                            r: pixels[index],
                            g: pixels[index + 1],
                            b: pixels[index + 2]
                        });
                    }
                }
            }
            allFramesData.push(frameData);
        }

        // Dọn dẹp rác (Xóa file tạm để Vercel không bị đầy bộ nhớ)
        fs.rmSync(tmpDir, { recursive: true, force: true });

        // 4. Gửi dữ liệu về Roblox
        return res.json({
            success: true,
            width: width,
            height: height,
            totalFrames: allFramesData.length,
            frames: allFramesData
        });

    } catch (error) {
        // Có lỗi thì dọn rác và báo về Roblox
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        return res.status(500).json({
            error: "Lỗi trong quá trình xử lý video MP4!",
            details: error.message
        });
    }
});

module.exports = app;
