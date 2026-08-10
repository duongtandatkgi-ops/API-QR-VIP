const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/api/gemini-proxy", async (req, res) => {
    // Bật CORS để Roblox thoải mái kết nối
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { prompt, apiKey } = req.body;

    if (!prompt || !apiKey) {
        return res.status(400).json({ error: "Thiếu prompt hoặc apiKey!" });
    }

    try {
        // Server trung gian gọi hộ Roblox sang Google Gemini
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(googleUrl, {
            contents: [
                {
                    role: "user",
                    parts: [{ text: "Bạn là trợ lý ảo Roblox. Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt. " + prompt }]
                }
            ]
        }, {
            headers: { "Content-Type": "application/json" }
        });

        const replyText = response.data.candidates[0].content.parts[0].text;
        return res.json({ success: true, text: replyText });

    } catch (error) {
        return res.status(500).json({ 
            error: "Lỗi kết nối Google AI", 
            details: error.response ? error.response.data : error.message 
        });
    }
});

module.exports = app;
