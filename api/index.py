from fastapi import FastAPI, Response, Query
import cv2
import tempfile
import os
import requests
import json

app = FastAPI(title="Video to Pixel API", version="1.0")

@app.get("/")
def read_root():
    return {"message": "Video Pixel API is running!"}

@app.get("/video-frames")
def get_video_frames(
    url: str = Query(..., description="Link video trực tiếp"),
    size: int = Query(15, description="Kích thước pixel (rộng/cao)"),
    fps: int = Query(5, description="Số khung hình trên giây để giảm tải")
):
    temp_path = None
    try:
        # Tải video tạm thời từ URL (hỗ trợ các link video trực tiếp mp4)
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code != 200:
            return {"error": "Không thể tải video từ URL này"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    tmp.write(chunk)
            temp_path = tmp.name

        cap = cv2.VideoCapture(temp_path)
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        if video_fps <= 0:
            video_fps = 30

        # Tính bước nhảy khung hình dựa trên fps yêu cầu
        frame_interval = int(video_fps / max(1, fps))
        frames_data = []
        count = 0
        max_frames = 30 # Giới hạn tối đa 30 frame để không bị quá tải timeout

        while cap.isOpened() and len(frames_data) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if count % frame_interval == 0:
                # Resize frame về kích thước nhỏ (ví dụ 15x15 pixel)
                resized = cv2.resize(frame, (size, size), interpolation=cv2.INTER_AREA)
                # Chuyển đổi màu từ BGR sang RGB
                rgb_frame = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
                
                frame_pixels = []
                for y in range(size):
                    for x in range(size):
                        b, g, r = rgb_frame[y, x]
                        frame_pixels.append({"x": int(x), "y": int(y), "r": int(r), "g": int(g), "b": int(b)})
                
                frames_data.append(frame_pixels)
            count += 1

        cap.release()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return {"frames": frames_data, "size": size}

    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return {"error": str(e)}
    
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
