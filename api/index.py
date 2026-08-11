from fastapi import FastAPI, Query
import qrcode

app = FastAPI(title="VIP QR Code API", version="2.0")

@app.get("/")
def read_root():
    return {"message": "VIP QR Code API is live! Use /matrix?url=..."}

@app.get("/matrix")
def get_matrix(url: str = Query(..., description="Link cần tạo QR")):
    try:
        # Cấu hình QR code
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=1,
            border=2, # Viền trắng chuẩn 2 block
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Tạo mảng 2 chiều chứa toàn 1 (Đen) và 0 (Trắng)
        matrix = []
        for row in qr.modules:
            matrix.append([1 if cell else 0 for cell in row])

        return {
            "success": True, 
            "size": len(matrix), 
            "matrix": matrix
        }
    
    except Exception as e:
        return {"error": str(e)}
