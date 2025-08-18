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

    # Load model YOLO
    model = YOLO(r"D:\PROJECTS\Traffic Detection using YOLO\runs\train\exp\weights\best.pt")
    # model = YOLO(r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\runs\train_bike\exp_bike\weights\best.pt")
    
    # Đường dẫn đến ảnh hoặc video
    
    # source = r"D:\JUPYTER NOTEBOOK\Traffic Detection using YOLO\AIP490_Defense.v1i.yolov11\AIP490_Defense.v1i.yolov11\test\images\Light_6_05950_jpg.rf.634691effb835c1ad0e94fc57e0a9c3f.jpg"
    source = r"D:\PROJECTS\Traffic Detection using YOLO\Data\train\images\00-137-_jpg.rf.466f72daba26bd54b65874e3357b688e.jpg"
    # Kiểm tra nguồn là video hay ảnh
    is_video = source.endswith(('.mp4', '.avi', '.mov'))

    if is_video:
        cap = cv2.VideoCapture(source)
        # Lấy FPS của video
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        if fps <= 0:  # Kiểm tra nếu FPS không hợp lệ
            fps = 30  # Giá trị mặc định
        delay = int(1000 / fps) 
         # Tính thời gian chờ (ms) cho mỗi khung hình
    else:
        current_frame = cv2.imread(source)
        if current_frame is None:
            print(f"Không thể đọc ảnh: {source}")
            exit()

    # Tạo cửa sổ OpenCV và gắn sự kiện chuột
    cv2.namedWindow('Frame')
    cv2.setMouseCallback('Frame', draw_polygon)

    # Lấy tên các lớp từ model
    class_names = model.names  # Danh sách tên lớp (e.g., ['bike', 'car', ...])

    if is_video:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            current_frame = frame.copy()

            # Dự đoán với YOLO
            results = model.predict(source=current_frame, device=0, save=False)
            boxes = []
            for result in results:
                for box in result.boxes:
                    x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                    class_id = box.cls[0].item()
                    boxes.append([x_min, y_min, x_max, y_max, class_id])

            # Vẽ bounding box của xe
            for box in boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = class_names[int(class_id)]
                color = (255, 0, 0) if class_name == 'bike' else (0, 0, 255)
                cv2.rectangle(current_frame, (int(x_min), int(y_min)), (int(x_max), int(y_max)), color, 2)
                cv2.putText(current_frame, class_name, (int(x_min), int(y_min) - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Vẽ các đa giác đã hoàn thành
            for polygon in polygons:
                cv2.polylines(current_frame, [np.array(polygon)], True, (0, 255, 0), 2)

            # Vẽ đa giác đang vẽ
            if current_polygon:
                cv2.polylines(current_frame, [np.array(current_polygon)], False, (0, 255, 0), 2)
                for point in current_polygon:
                    cv2.circle(current_frame, point, 3, (0, 0, 255), -1)

            # Đếm số lượng xe trong từng đa giác
            polygon_counts = count_vehicles_in_polygons(boxes, polygons, class_names)

            # Hiển thị số lượng xe
            total_counts = {'bike': 0, 'car': 0}
            for i, counts in enumerate(polygon_counts):
                total_counts['bike'] += counts['bike']
                total_counts['car'] += counts['car']
                # Hiển thị số lượng xe cho từng đa giác
                cv2.putText(current_frame, f'P{i+1}: M={counts["bike"]}, C={counts["car"]}',
                           (10, 30 + i * 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            # Hiển thị tổng số lượng
            cv2.putText(current_frame, f'Total bikes: {total_counts["bike"]}', (10, 30 + len(polygon_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(current_frame, f'Total Cars: {total_counts["car"]}', (10, 60 + len(polygon_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cv2.imshow('Frame', current_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                print("Saving predictions to predict.txt")
                save_predictions(polygons, polygon_counts)
                print("Polygon coordinates and counts:", list(zip(polygons, polygon_counts)))

        cap.release()
    else:
        # Xử lý ảnh tĩnh
        results = model.predict(source=current_frame, device=0, save=False)
        boxes = []
        for result in results:
            for box in result.boxes:
                x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                class_id = box.cls[0].item()
                boxes.append([x_min, y_min, x_max, y_max, class_id])

        while True:
            # Vẽ bounding box của xe
            frame_copy = current_frame.copy()
            for box in boxes:
                x_min, y_min, x_max, y_max, class_id = box
                class_name = class_names[int(class_id)]
                color = (255, 0, 0) if class_name == 'bike' else (0, 0, 255)
                cv2.rectangle(frame_copy, (int(x_min), int(y_min)), (int(x_max), int(y_max)), color, 2)
                cv2.putText(frame_copy, class_name, (int(x_min), int(y_min) - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Vẽ các đa giác đã hoàn thành
            for polygon in polygons:    
                cv2.polylines(frame_copy, [np.array(polygon)], True, (0, 255, 0), 2)

            # Vẽ đa giác đang vẽ
            if current_polygon:
                cv2.polylines(frame_copy, [np.array(current_polygon)], False, (0, 255, 0), 2)
                for point in current_polygon:
                    cv2.circle(frame_copy, point, 3, (0, 0, 255), -1)

            # Đếm số lượng xe trong từng đa giác
            polygon_counts = count_vehicles_in_polygons(boxes, polygons, class_names)

            # Hiển thị số lượng xe
            total_counts = {'bike': 0, 'car': 0}
            for i, counts in enumerate(polygon_counts):
                total_counts['bike'] += counts['bike']
                total_counts['car'] += counts['car']
                cv2.putText(frame_copy, f'P{i+1}: M={counts["bike"]}, C={counts["car"]}',
                           (10, 30 + i * 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            cv2.putText(frame_copy, f'Total Bikes: {total_counts["bike"]}', (10, 30 + len(polygon_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame_copy, f'Total Cars: {total_counts["car"]}', (10, 60 + len(polygon_counts) * 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cv2.imshow('Frame', frame_copy)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                print("Saving predictions to predict.txt")
                save_predictions(polygons, polygon_counts)
                print("Polygon coordinates and counts:", list(zip(polygons, polygon_counts)))

    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()