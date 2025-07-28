from ultralytics import YOLO
import cv2
import os
import torch

def predict_yolo():
    vehicle_model = YOLO(r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\runs\train_vehicle\exp_vehicle\weights\best.pt")
    license_plate_model = YOLO(r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\runs\train_license\exp_license\weights\best.pt")  # Đường dẫn đến mô hình biển số xe
    test_dir = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\Combined_Data\valid\images\2009_003589_jpg.rf.98daa631a5563cfde3be9729f44190cf.jpg"
    image = cv2.imread(test_dir)
    if image is None:
        print(f"Không thể đọc ảnh: {test_dir}")
        return
    vehicle_results = vehicle_model.predict(
        source=test_dir,
        device=0,
        save=False
    )
    final_results = []
    for result in vehicle_results:
        boxes = result.boxes
        labels = result.names

        for box in boxes:
            label = labels[int(box.cls)]
            confidence = float(box.conf)
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if label in ['bike', 'car']:
                final_results.append({
                    'label': label,
                    'confidence': confidence,
                    'box': [x1, y1, x2, y2]
                })
                vehicle_image = image[y1:y2, x1:x2]
                lp_results = license_plate_model.predict(
                    source=vehicle_image,
                    device=0,
                    save=False
                )

                for lp_result in lp_results:
                    lp_boxes = lp_result.boxes
                    lp_labels = lp_result.names
                    for lp_box in lp_boxes:
                        lp_label = lp_labels[int(lp_box.cls)]
                        if lp_label == 'license_plate':  
                            lp_confidence = float(lp_box.conf)
                            lp_x1, lp_y1, lp_x2, lp_y2 = map(int, lp_box.xyxy[0])
                            lp_x1, lp_x2 = lp_x1 + x1, lp_x2 + x1
                            lp_y1, lp_y2 = lp_y1 + y1, lp_y2 + y1

                            final_results.append({
                                'label': lp_label,
                                'confidence': lp_confidence,
                                'box': [lp_x1, lp_y1, lp_x2, lp_y2]
                            })
            if label == 'bike':
                bike_image = image[y1:y2, x1:x2]
                helmet_results = vehicle_model.predict(
                    source=bike_image,
                    device=0,
                    save=False
                )

                for h_result in helmet_results:
                    h_boxes = h_result.boxes
                    h_labels = h_result.names
                    for h_box in h_boxes:
                        h_label = h_labels[int(h_box.cls)]
                        if h_label in ['Helmet', 'Non_helmet']:
                            h_confidence = float(h_box.conf)
                            h_x1, h_y1, h_x2, h_y2 = map(int, h_box.xyxy[0])
                            h_x1, h_x2 = h_x1 + x1, h_x2 + x1
                            h_y1, h_y2 = h_y1 + y1, h_y2 + y1

                            final_results.append({
                                'label': h_label,
                                'confidence': h_confidence,
                                'box': [h_x1, h_y1, h_x2, h_y2]
                            })

    for result in final_results:
        label = result['label']
        confidence = result['confidence']
        x1, y1, x2, y2 = result['box']
        if label in ['bike', 'car']:
            color = (0, 255, 0)  
        elif label in ['Helmet', 'Non_helmet']:
            color = (0, 0, 255) 
        else:  
            color = (0, 255, 255)  
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(image, f'{label} {confidence:.2f}', (x1, y1-10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    output_dir = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\runs\predict\exp"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, os.path.basename(test_dir))
    cv2.imwrite(output_path, image)
    print(f"Đã lưu kết quả tại: {output_path}")

    cv2.imshow('Result', image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    print(f"Ảnh: {test_dir}")
    for result in final_results:
        print(f"Phát hiện: {result['label']} (Confidence: {result['confidence']:.2f})")

if __name__ == "__main__":
    if not torch.cuda.is_available():
        print("GPU không khả dụng. Vui lòng kiểm tra cài đặt CUDA!")
        exit()
    
    predict_yolo()