from fastapi import from fastapi import FastAPI, Response, Query
import qrcode
import io

app = FastAPI(title="VIP QR Code API", version="1.0")

@app.get("/")
def read_root():
    return {"message": "QR Code API is running!"}

@app.get("/generate")
def generate_qr(
    url: str = Query(..., description="Link cần tạo QR"),
    size: int = Query(35, description="Kích thước")
):
    try:
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=1, # Đặt box_size = 1 để mỗi ô pixel là 1 block chuẩn xác
            border=0,   # Bỏ border ở API vì script Roblox đã tự bọc viền trắng bên ngoài rồi
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Tạo ảnh chuẩn đen trắng 100%
        img = qr.make_image(fill_color="black", back_color="white").convert('L')
        
        # Resize cứng về đúng kích thước pixel mà người dùng chọn để không bị mờ nhòe
        img = img.resize((size, size), resample=0) # Resample 0 (NEAREST) giữ nguyên điểm ảnh sắc nét

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        return Response(content=buf.getvalue(), media_type="image/png")
    
    except Exception as e:
        return {"error": str(e)}
, Response, Query
import qrcode
import io

app = FastAPI(title="VIP QR Code API", version="1.0")

@app.get("/")
def read_root():
    return {"message": "QR Code API is running!"}

@app.get("/generate")
def generate_qr(
    url: str = Query(..., description="Link cần tạo QR"),
    size: int = Query(35, description="Kích thước")
):
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Tạo ảnh QR dạng đen trắng tuyệt đối (1bit / monochrome) tránh bị mờ xám
        img = qr.make_image(fill_color="black", back_color="white").convert('1')

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        return Response(content=buf.getvalue(), media_type="image/png")
    
    except Exception as e:
        return {"error": str(e)}

        return Response(content=buf.getvalue(), media_type="image/png")
    
    except Exception as e:
        return {"error": str(e)}
