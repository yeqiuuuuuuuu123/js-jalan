from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO

import os
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

import torch
import cv2
import numpy as np
import threading
import time

app = Flask(__name__)
CORS(app)

print("===================================")
print("CUDA STATUS")
print("===================================")

print(
    "CUDA Available:",
    torch.cuda.is_available()
)

if torch.cuda.is_available():

    print(
        "GPU:",
        torch.cuda.get_device_name(0)
    )

else:

    print("GPU NOT DETECTED")

print("===================================")
print("Loading YOLO model...")
print("===================================")

model = YOLO("best.pt")
if torch.cuda.is_available():
 model.to("cuda")

print("===================================")
print("YOLO GPU loaded successfully!")
print("===================================")

# ============================
# RTSP CAMERA
# ============================

RTSP_URL = "rtsp://100.120.69.44:8554/camera"

cap = cv2.VideoCapture(
    RTSP_URL,
    cv2.CAP_FFMPEG
)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)


if cap.isOpened():
    print("RTSP Camera Connected")
else:
    print("RTSP Camera Failed")

latest_frame = None
latest_detection = None
latest_boxes = []

lock = threading.Lock()

# ============================
# CAMERA THREAD
# ============================

def camera_loop():

    global latest_frame, cap

    while True:

        if cap is None or not cap.isOpened():

            print("Reconnect RTSP...")

            cap = cv2.VideoCapture(
                RTSP_URL,
                cv2.CAP_FFMPEG
            )
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            time.sleep(1)
            continue

        ret, frame = cap.read()

        if ret:


            with lock:
                latest_frame = frame.copy()

        else:

            print("Frame gagal dibaca, reconnect...")

            cap.release()
            cap = None

            time.sleep(1)

# ============================
# YOLO DETECTION THREAD
# ============================

def detection_loop():

    global latest_detection
    global latest_boxes

    device = (
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    while True:

        with lock:

            if latest_frame is None:
                frame = None
            else:
                frame = latest_frame.copy()

        if frame is None:
            time.sleep(0.1)
            continue

        try:

            # Resize khusus untuk YOLO supaya lebih ringan
            results = model(
                frame,
                imgsz=640,
                conf=0.70,
                iou=0.45,
                device=device,
                verbose=False
            )

            detection = None
            boxes_data = []

            for r in results:

                for box in r.boxes:

                    x1, y1, x2, y2 = map(
                        int,
                        box.xyxy[0]
                    )

                    cls = int(
                        box.cls[0]
                    )

                    confidence = float(
                        box.conf[0]
                    )

                    label = model.names[cls]

                    if label == "Large Pothole":
                        label = "besar"

                    elif label == "Medium Pothole":
                        label = "sedang"

                    elif label == "Small Pothole":
                        label = "kecil"

                    boxes_data.append({
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "label": label,
                        "confidence": confidence
                    })

                    # Untuk latest_detection
                    if detection is None:

                        detection = {
                            "label": label,
                            "confidence": confidence
                        }

            with lock:

                latest_detection = detection
                latest_boxes = boxes_data

        except Exception as e:

            print(
                "YOLO THREAD ERROR:",
                e
            )

        # YOLO tidak perlu memproses setiap frame kamera
        time.sleep(0.1)
@app.route("/video_feed")
def video_feed():

    def generate():

        while True:

            with lock:

                if latest_frame is None:
                    frame = None
                else:
                    frame = latest_frame.copy()

                boxes = latest_boxes.copy()

            if frame is None:

                time.sleep(0.01)
                continue

            # =========================
            # GAMBAR BOUNDING BOX
            # =========================

            for box in boxes:

                x1 = box["x1"]
                y1 = box["y1"]
                x2 = box["x2"]
                y2 = box["y2"]

                label = box["label"]

                confidence = box["confidence"]

                text = (
                    f"{label} "
                    f"{confidence * 100:.1f}%"
                )

                # Bounding box
                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

                # Label
                cv2.putText(
                    frame,
                    text,
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

            # =========================
            # ENCODE VIDEO
            # =========================

            ret, buffer = cv2.imencode(
                ".jpg",
                frame,
                [
                    cv2.IMWRITE_JPEG_QUALITY,
                    70
                ]
            )

            if not ret:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buffer.tobytes()
                + b"\r\n"
            )

            # Batasi sekitar 20 FPS
            time.sleep(0.05)

    return Response(
        generate(),
        mimetype=
        "multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/")
def home():

    gpu = (
        torch.cuda.get_device_name(0)
        if torch.cuda.is_available()
        else "CPU"
    )

    return jsonify({

        "status": "YOLO Flask GPU Server Running",

        "gpu": gpu

    })

@app.route("/latest_detection")
def latest_detection_api():

    global latest_detection

    if latest_detection is None:
        return jsonify({
            "status": "no_detection"
        })

    return jsonify({
        "status": "success",
        "label": latest_detection["label"],
        "confidence": latest_detection["confidence"]
    })

@app.route("/detect", methods=["POST"])
def detect():

    try:

        if "image" not in request.files:

            return jsonify([])

        file = request.files["image"]

        image_bytes = file.read()

        npimg = np.frombuffer(

            image_bytes,

            np.uint8

        )

        img = cv2.imdecode(

            npimg,

            cv2.IMREAD_COLOR

        )

        if img is None:

            return jsonify([])
        if img is None:

            return jsonify([])
        
        img = cv2.resize(

            img,

            (640, 640)

        )
        
        device = "cuda" if torch.cuda.is_available() else "cpu"

        results = model(

            img,

            conf=0.70,

            iou=0.45,

            device= device

        )

        detections = []

        for r in results:

            boxes = r.boxes

            for box in boxes:

                x1, y1, x2, y2 = map(

                    int,

                    box.xyxy[0]

                )

                conf = float(
                    box.conf[0]
                )

                if conf < 0.50:
                 continue

                cls = int(
                    box.cls[0]
                )

                label = model.names[cls]

                # =========================
                # MAPPING CLASS
                # =========================

                if label == "Large Pothole":
                    label = "besar"

                elif label == "Medium Pothole":
                    label = "sedang"

                elif label == "Small Pothole":
                    label = "kecil"

                detections.append({

                    "label":
                        label,

                    "confidence":
                        conf,

                    "box":[

                        x1,
                        y1,
                        x2,
                        y2

                    ]

                })

        print("===================================")
        print("DETECTION RESULT")
        print(detections)
        print("===================================")

        return jsonify(detections)

    except Exception as e:

        print("===================================")
        print("ERROR:")
        print(e)
        print("===================================")

        return jsonify([])

if __name__ == "__main__":

    # Thread kamera RTSP
    threading.Thread(
        target=camera_loop,
        daemon=True
    ).start()

    # Thread YOLO
    threading.Thread(
        target=detection_loop,
        daemon=True
    ).start()

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True,
        use_reloader=False,
        threaded=True
    )