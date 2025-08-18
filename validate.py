from ultralytics import YOLO

def validate_yolo():
    # model = YOLO("runs/train/exp/weights/best.pt")
    model = YOLO(r"D:/JUPYTER NOTEBOOK/Traffic Detection using YOLO/runs/train/exp/weights/best.pt")
    metrics = model.val(
        data=r"D:/JUPYTER NOTEBOOK/Traffic Detection using YOLO/data.yaml",
        device=0  
    )
    print(f"mAP50: {metrics.box.map50}")
    print(f"mAP50-95: {metrics.box.map}")

if __name__ == "__main__":
    import torch
    if not torch.cuda.is_available():
        print("GPU không khả dụng. Vui lòng kiểm tra cài đặt CUDA!")
        exit()
    validate_yolo()