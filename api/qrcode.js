const qrcode = require('qrcode');

module.exports = async (req, res) => {
    // 1. Cấu hình CORS để Roblox Executor không bị chặn khi gọi API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý request OPTIONS (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Lấy đường link cần tạo QR từ tham số URL (?link=...)
    const { link } = req.query;

    if (!link) {
        return res.status(400).json({ 
            success: false, 
            error: "Vui lòng truyền tham số link! Ví dụ: ?link=https://github.com" 
        });
    }

    try {
        // 3. Tạo ma trận QR Code
        // Mức 'L' (Low) giúp ma trận đơn giản nhất, ô vuông to dễ quét nhất
        const qr = qrcode.create(link, { errorCorrectionLevel: 'L' });
        const size = qr.modules.size;
        const data = qr.modules.data; // Mảng 1 chiều chứa dữ liệu 1 (Đen) và 0 (Trắng)

        // 4. Chuyển đổi dữ liệu thành mảng 2 chiều (Ma trận vuông)
        let matrix = [];
        for (let y = 0; y < size; y++) {
            let row = [];
            for (let x = 0; x < size; x++) {
                // Đọc từng bit: Nếu có dữ liệu là 1 (Đen), ngược lại là 0 (Trắng)
                row.push(data[y * size + x] ? 1 : 0);
            }
            matrix.push(row);
        }

        // 5. Trả kết quả về cho Lua script
        return res.status(200).json({
            success: true,
            size: size,
            matrix: matrix
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Lỗi hệ thống khi tạo QR: " + error.message 
        });
    }
};
