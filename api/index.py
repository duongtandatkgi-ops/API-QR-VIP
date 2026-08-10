from fastapi import FastAPI, Query
import cv2
import tempfile
import os
import requests

app = FastAPI(title="MP4 Video Scanner API")

@app.get("/")
def root():
    return {"status": "Video Scanner API is active!"}

@app.get("/scan-video")
def scan_video(
    url: str = Query(..., description="Link URL video (.mp4)"),
    size: int = Query(15, description="Kích thước màn hình pixel (15x15)"),
    fps: int = Query(5, description="Số khung hình/giây để xử lý")
):
    temp_path = None
    try:
        # Tải video mp4 từ URL
        res = requests.get(url, stream=True, timeout=12)
        if res.status_code != 200:
            return {"error": "Không thể tải video từ URL"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            for chunk in res.iter_content(chunk_size=8192):
                if chunk:
                    tmp.write(chunk)
            temp_path = tmp.name

        cap = cv2.VideoCapture(temp_path)
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        if video_fps <= 0:
            video_fps = 30

        frame_interval = int(video_fps / max(1, fps))
        frames_data = []
        count = 0
        max_frames = 40 # Giới hạn 40 frame tối đa để tránh crash serverless

        while cap.isOpened() and len(frames_data) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if count % frame_interval == 0:
                resized = cv2.resize(frame, (size, size), interpolation=cv2.INTER_AREA)
                rgb_frame = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
                
                pixels = []
                for y in range(size):
                    for x in range(size):
                        b, g, r = rgb_frame[y, x]
                        pixels.append({"x": int(x), "y": int(y), "r": int(r), "g": int(g), "b": int(b)})
                
                frames_data.append(pixels)
            count += 1

        cap.release()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return {
            "total_frames": len(frames_data),
            "size": size,
            "frames": frames_data
        }

    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return {"error": str(e)}
