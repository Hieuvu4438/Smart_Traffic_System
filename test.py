from ultralytics import YOLO
import cv2
import numpy as np
import torch
import os

# Biến toàn cục
polygons = []  # Lưu danh sách các đa giác (mỗi đa giác là danh sách các điểm)
current_polygon = []  # Lưu các điểm của đa giác đang vẽ
drawing = False
current_frame = None  # Biến lưu frame hiện tại

def draw_polygon(event, x, y, flags, param):
    global drawing, current_polygon, polygons, current_frame
    
    if current_frame is None:
        return  # Tránh lỗi nếu frame chưa được khởi tạo
    
    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        current_polygon.append((x, y))
        img_copy = current_frame.copy()
        if len(current_polygon) > 1:
            cv2.polylines(img_copy, [np.array(current_polygon)], False, (0, 255, 0), 2)
        cv2.circle(img_copy, (x, y), 3, (0, 0, 255), -1)  # Vẽ điểm
        cv2.imshow('Frame', img_copy)
    
    elif event == cv2.EVENT_RBUTTONDOWN and drawing and len(current_polygon) > 2:
        drawing = False
        polygons.append(current_polygon.copy())
        current_polygon.clear()
        img_copy = current_frame.copy()
        cv2.polylines(img_copy, [np.array(polygons[-1])], True, (0, 255, 0), 2)
        cv2.imshow('Frame', img_copy)

def is_vehicle_in_polygon(box, polygon):
    """Kiểm tra xem tâm của bounding box có nằm trong đa giác hay không"""
    box_center_x = (box[0] + box[2]) / 2
    box_center_y = (box[1] + box[3]) / 2
    polygon_np = np.array(polygon, dtype=np.int32)
    return cv2.pointPolygonTest(polygon_np, (box_center_x, box_center_y), False) >= 0

def count_vehicles_in_polygons(boxes, polygons, class_names):
    """Đếm số lượng xe trong từng đa giác"""
    polygon_counts = []
    for polygon in polygons:
        counts = {'bike': 0, 'car': 0}
        for box in boxes:
            if is_vehicle_in_polygon(box, polygon):
                class_id = int(box[4])
                class_name = class_names[class_id]
                if class_name == 'bike':
                    counts['bike'] += 1
                elif class_name == 'car':
                    counts['car'] += 1
        polygon_counts.append(counts)
    return polygon_counts

def save_predictions(polygons, polygon_counts, filename='predict.txt'):
    """Lưu tọa độ đa giác và số lượng xe vào file"""
    with open(filename, 'w') as f:
        for i, (polygon, counts) in enumerate(zip(polygons, polygon_counts)):
            f.write(f"Polygon {i + 1}: {polygon}\n")
            f.write(f"  bikes: {counts['bike']}, Cars: {counts['car']}\n")
            f.write("---\n")

def main():
    global current_frame, polygons, current_polygon

    # Kiểm tra GPU
    if not torch.cuda.is_available():
        print("GPU không khả dụng. Vui lòng kiểm tra cài đặt CUDA!")
        exit()

    # Load hai mô hình YOLO
    vehicle_model = YOLO(r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\runs\train_vehicle\exp_vehicle\weights\epoch10.pt")
    license_model = YOLO(r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\runs\train_license\exp_license\weights\best.pt")
    
    # Đường dẫn đến ảnh hoặc video
    # source = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\Combined_Data\test\images\static-images.vnncdn.net-vps_images_publish-000001-000003-2024-7-11-_w-camera5-4176.jpg"
    source = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\5229647-uhd_3840_2160_30fps.mp4"
    # Kiểm tra nguồn là video hay ảnh
    is_video = source.endswith(('.mp4', '.avi', '.mov'))

    if is_video:
        cap = cv2.VideoCapture(source)
    else:
        current_frame = cv2.imread(source)
        if current_frame is None:
            print(f"Không thể đọc ảnh: {source}")
            exit()

    # Tạo cửa sổ OpenCV và gắn sự kiện chuột
    cv2.namedWindow('Frame')
    cv2.setMouseCallback('Frame', draw_polygon)

    # Lấy tên các lớp từ vehicle_model
    vehicle_class_names = vehicle_model.names  # Danh sách tên lớp (e.g., ['bike', 'car', 'Helmet', 'Non_helmet'])

    if is_video:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            current_frame = frame.copy()

            # Dự đoán với vehicle_model
            vehicle_results = vehicle_model.predict(source=current_frame, device=0, save=False)
            vehicle_boxes = []
            for result in vehicle_results:
                for box in result.boxes:
                    x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                    class_id = box.cls[0].item()
                    vehicle_boxes.append([x_min, y_min, x_max, y_max, class_id])

            # Dự đoán với license_model
            license_results = license_model.predict(source=current_frame, device=0, save=False)
            license_boxes = []
            for result in license_results:
                for box in result.boxes:
                    x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                    class_id = box.cls[0].item()
                    license_boxes.append([x_min, y_min, x_max, y_max, class_id])

            # Vẽ bounding box của phương tiện và mũ
            for box in vehicle_boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = vehicle_class_names[int(class_id)]
                color = (255, 0, 0) if class_name == 'bike' else (0, 0, 255) if class_name == 'car' else (0, 255, 0)
                if class_name in ['Helmet', 'Non_helmet']:
                    continue  # Không vẽ mũ ở đây, sẽ vẽ sau khi điều chỉnh tọa độ
                cv2.rectangle(current_frame, (int(x_min), int(y_min)), (int(x_max), int(y_max)), color, 2)
                cv2.putText(current_frame, class_name, (int(x_min), int(y_min) - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Xử lý mũ bảo hiểm cho xe máy
            for box in vehicle_boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = vehicle_class_names[int(class_id)]
                if class_name == 'bike':
                    bike_image = current_frame[int(y_min):int(y_max), int(x_min):int(x_max)]
                    helmet_results = vehicle_model.predict(source=bike_image, device=0, save=False)
                    for h_result in helmet_results:
                        for h_box in h_result.boxes:
                            h_class_id = h_box.cls[0].item()
                            h_label = vehicle_class_names[int(h_class_id)]
                            if h_label in ['Helmet', 'Non_helmet']:
                                h_confidence = float(h_box.conf)
                                h_x1, h_y1, h_x2, h_y2 = h_box.xyxy[0].tolist()
                                h_x1, h_x2 = int(h_x1) + int(x_min), int(h_x2) + int(x_min)
                                h_y1, h_y2 = int(h_y1) + int(y_min), int(h_y2) + int(y_min)
                                cv2.rectangle(current_frame, (h_x1, h_y1), (h_x2, h_y2), (0, 0, 255), 2)
                                cv2.putText(current_frame, f'{h_label} {h_confidence:.2f}', (h_x1, h_y1 - 10),
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            # Vẽ bounding box của biển số
            license_class_names = license_model.names  # Danh sách tên lớp (e.g., ['biensoxehoi'])
            for box in license_boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = license_class_names[int(class_id)]
                if class_name == 'biensoxehoi':
                    cv2.rectangle(current_frame, (int(x_min), int(y_min)), (int(x_max), int(y_max)), (0, 255, 0), 2)
                    cv2.putText(current_frame, class_name, (int(x_min), int(y_min) - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Vẽ các đa giác đã hoàn thành
            for polygon in polygons:
                cv2.polylines(current_frame, [np.array(polygon)], True, (0, 255, 0), 2)

            # Vẽ đa giác đang vẽ
            if current_polygon:
                cv2.polylines(current_frame, [np.array(current_polygon)], False, (0, 255, 0), 2)
                for point in current_polygon:
                    cv2.circle(current_frame, point, 3, (0, 0, 255), -1)

            # Đếm số lượng xe trong từng đa giác
            vehicle_counts = count_vehicles_in_polygons(vehicle_boxes, polygons, vehicle_class_names)

            # Hiển thị số lượng xe
            total_counts = {'bike': 0, 'car': 0}
            for i, counts in enumerate(vehicle_counts):
                total_counts['bike'] += counts['bike']
                total_counts['car'] += counts['car']
                cv2.putText(current_frame, f'P{i+1}: M={counts["bike"]}, C={counts["car"]}',
                           (10, 30 + i * 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            # Hiển thị tổng số lượng
            cv2.putText(current_frame, f'Total Bikes: {total_counts["bike"]}', (10, 30 + len(vehicle_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(current_frame, f'Total Cars: {total_counts["car"]}', (10, 60 + len(vehicle_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cv2.imshow('Frame', current_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                print("Saving predictions to predict.txt")
                save_predictions(polygons, vehicle_counts)
                print("Polygon coordinates and counts:", list(zip(polygons, vehicle_counts)))

        cap.release()
    else:
        # Xử lý ảnh tĩnh
        vehicle_results = vehicle_model.predict(source=current_frame, device=0, save=False)
        vehicle_boxes = []
        for result in vehicle_results:
            for box in result.boxes:
                x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                class_id = box.cls[0].item()
                vehicle_boxes.append([x_min, y_min, x_max, y_max, class_id])

        license_results = license_model.predict(source=current_frame, device=0, save=False)
        license_boxes = []
        for result in license_results:
            for box in result.boxes:
                x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                class_id = box.cls[0].item()
                license_boxes.append([x_min, y_min, x_max, y_max, class_id])

        while True:
            # Vẽ bounding box của phương tiện và mũ
            frame_copy = current_frame.copy()
            for box in vehicle_boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = vehicle_class_names[int(class_id)]
                color = (255, 0, 0) if class_name == 'bike' else (0, 0, 255) if class_name == 'car' else (0, 255, 0)
                if class_name in ['Helmet', 'Non_helmet']:
                    continue  # Không vẽ mũ ở đây, sẽ vẽ sau khi điều chỉnh tọa độ
                cv2.rectangle(frame_copy, (int(x_min), int(y_min)), (int(x_max), int(y_max)), color, 2)
                cv2.putText(frame_copy, class_name, (int(x_min), int(y_min) - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Xử lý mũ bảo hiểm cho xe máy
            for box in vehicle_boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = vehicle_class_names[int(class_id)]
                if class_name == 'bike':
                    bike_image = frame_copy[int(y_min):int(y_max), int(x_min):int(x_max)]
                    helmet_results = vehicle_model.predict(source=bike_image, device=0, save=False)
                    for h_result in helmet_results:
                        for h_box in h_result.boxes:
                            h_class_id = h_box.cls[0].item()
                            h_label = vehicle_class_names[int(h_class_id)]
                            if h_label in ['Helmet', 'Non_helmet']:
                                h_confidence = float(h_box.conf)
                                h_x1, h_y1, h_x2, h_y2 = h_box.xyxy[0].tolist()
                                h_x1, h_x2 = int(h_x1) + int(x_min), int(h_x2) + int(x_min)
                                h_y1, h_y2 = int(h_y1) + int(y_min), int(h_y2) + int(y_min)
                                cv2.rectangle(frame_copy, (h_x1, h_y1), (h_x2, h_y2), (0, 0, 255), 2)
                                cv2.putText(frame_copy, f'{h_label} {h_confidence:.2f}', (h_x1, h_y1 - 10),
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            # Vẽ bounding box của biển số
            for box in license_boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = license_model.names[int(class_id)]
                if class_name == 'biensoxehoi':
                    cv2.rectangle(frame_copy, (int(x_min), int(y_min)), (int(x_max), int(y_max)), (0, 255, 0), 2)
                    cv2.putText(frame_copy, class_name, (int(x_min), int(y_min) - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Vẽ các đa giác đã hoàn thành
            for polygon in polygons:
                cv2.polylines(frame_copy, [np.array(polygon)], True, (0, 255, 0), 2)

            # Vẽ đa giác đang vẽ
            if current_polygon:
                cv2.polylines(frame_copy, [np.array(current_polygon)], False, (0, 255, 0), 2)
                for point in current_polygon:
                    cv2.circle(frame_copy, point, 3, (0, 0, 255), -1)

            # Đếm số lượng xe trong từng đa giác
            vehicle_counts = count_vehicles_in_polygons(vehicle_boxes, polygons, vehicle_class_names)

            # Hiển thị số lượng xe
            total_counts = {'bike': 0, 'car': 0}
            for i, counts in enumerate(vehicle_counts):
                total_counts['bike'] += counts['bike']
                total_counts['car'] += counts['car']
                cv2.putText(frame_copy, f'P{i+1}: M={counts["bike"]}, C={counts["car"]}',
                           (10, 30 + i * 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            cv2.putText(frame_copy, f'Total Bikes: {total_counts["bike"]}', (10, 30 + len(vehicle_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame_copy, f'Total Cars: {total_counts["car"]}', (10, 60 + len(vehicle_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cv2.imshow('Frame', frame_copy)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                print("Saving predictions to predict.txt")
                save_predictions(polygons, vehicle_counts)
                print("Polygon coordinates and counts:", list(zip(polygons, vehicle_counts)))

    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()