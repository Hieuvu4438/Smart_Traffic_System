from ultralytics import YOLO
import cv2
import os
import torch

def predict_yolo(video_path, model_path, output_dir):
    # Kiểm tra GPU
    if not torch.cuda.is_available():
        print("GPU không khả dụng. Vui lòng kiểm tra cài đặt CUDA!")
        return
    if not os.path.exists(video_path):
        print(f"File video {video_path} không tồn tại!")
        return

    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Lỗi khi tải mô hình: {e}")
        return

    os.makedirs(output_dir, exist_ok=True)

    results = model.predict(
        source=video_path,
        device=0, 
        save=True,  
        project=output_dir,  
        name="exp",  
        exist_ok=True,  
        conf=0.5,  
        iou=0.7,  
        save_txt=False,  
        save_conf=True  
    )

    for result in results:
        print(f"Frame: {result.path}")
        print(f"Phát hiện (classes): {result.boxes.cls.tolist()}")
        print(f"Độ tin cậy: {result.boxes.conf.tolist()}")
        print("---")

    print(f"Kết quả đã được lưu tại: {output_dir}/exp")

if __name__ == "__main__":
    model_path = r"D:/JUPYTER NOTEBOOK/Traffic Detection using YOLO/runs/train/exp/weights/best.pt"
    video_path = r"D:/JUPYTER NOTEBOOK/Traffic Detection using YOLO/Data/test/video/7h.9.9.22.mp4"
    output_dir = r"D:/JUPYTER NOTEBOOK/Traffic Detection using YOLO/runs/predict"

    predict_yolo(video_path, model_path, output_dir)