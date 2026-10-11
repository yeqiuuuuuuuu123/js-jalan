import cv2
import time

url = "rtsp://100.120.69.44:8554/camera"

cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)

start = time.time()

while True:
    ret, frame = cap.read()

    if not ret:
        print("Frame gagal")
        break

    cv2.imshow("RTSP Test", frame)

    if time.time() - start > 120:
        print("2 menit selesai")
        break

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()