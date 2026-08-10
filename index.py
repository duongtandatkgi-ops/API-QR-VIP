from fastapi import FastAPI, Response, Query
import qrcode
import io

app = FastAPI(title="VIP QR Code API", version="1.0")

@app.get("/")
def read_root():
    return {"message": "VIP QR Code API is live on Vercel! Use /generate?url=..."}

@app.get("/generate")
def generate_qr(
    url: str = Query(..., description="Link cần tạo QR"),
    fill_color: str = Query("black", description="Màu mã QR"),
    back_color: str = Query("white", description="Màu nền"),
    size: int = Query(10, description="Kích thước box_size"),
    border: int = Query(2, description="Độ dày viền")
):
    try:
        # Cấu hình QR code với mức độ chống lỗi cao
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=size,
            border=border,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Tạo hình ảnh QR
        img = qr.make_image(fill_color=fill_color, back_color=back_color).convert('RGB')

        # Lưu vào buffer bộ nhớ đệm
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        return Response(content=buf.getvalue(), media_type="image/png")
    
    except Exception as e:
        return {"error": str(e)}
