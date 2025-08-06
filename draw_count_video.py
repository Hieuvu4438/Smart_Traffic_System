from ultralytics import YOLO
import cv2
import numpy as np
import torch
import time
import threading
from queue import Queue

# Biến toàn cục
polygons = []  # Lưu danh sách các đa giác (mỗi đa giác là danh sách các điểm)
current_polygon = []  # Lưu các điểm của đa giác đang vẽ
drawing = False
current_frame = None  # Biến lưu frame hiện tại
frame_with_overlay = None  # Frame đã vẽ overlay
frame_queue = Queue(maxsize=5)  # Queue để xử lý frame bất đồng bộ

def draw_polygon(event, x, y, flags, param):
    global drawing, current_polygon, polygons, current_frame, frame_with_overlay
    
    if current_frame is None:
        return
    
    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        current_polygon.append((x, y))
        
    elif event == cv2.EVENT_RBUTTONDOWN and drawing and len(current_polygon) > 2:
        drawing = False
        polygons.append(current_polygon.copy())
        current_polygon.clear()
        print(f"Đã tạo đa giác thứ {len(polygons)} với {len(polygons[-1])} điểm")

def is_vehicle_in_polygon(box, polygon):
    """Kiểm tra xem tâm của bounding box có nằm trong đa giác hay không"""
    if len(polygon) < 3:
        return False
    
    box_center_x = (box[0] + box[2]) / 2
    box_center_y = (box[1] + box[3]) / 2
    polygon_np = np.array(polygon, dtype=np.int32)
    return cv2.pointPolygonTest(polygon_np, (box_center_x, box_center_y), False) >= 0

def count_vehicles_in_polygons(boxes, polygons, class_names):
    """Đếm số lượng xe trong từng đa giác"""
    polygon_counts = []
    for polygon in polygons:
        counts = {'bike': 0, 'car': 0, 'total': 0}
        for box in boxes:
            if is_vehicle_in_polygon(box, polygon):
                class_id = int(box[4])
                if class_id < len(class_names):
                    class_name = class_names[class_id]
                    if class_name in ['bike', 'motorcycle']:
                        counts['bike'] += 1
                    elif class_name in ['car', 'truck', 'bus']:
                        counts['car'] += 1
                    counts['total'] += 1
        polygon_counts.append(counts)
    return polygon_counts

def save_predictions(polygons, polygon_counts, filename='predict_video.txt'):
    """Lưu tọa độ đa giác và số lượng xe vào file"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"=== KẾT QUẢ PHÂN TÍCH VIDEO ===\n")
        f.write(f"Thời gian: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Số lượng vùng: {len(polygons)}\n\n")
        
        total_bikes = sum(counts['bike'] for counts in polygon_counts)
        total_cars = sum(counts['car'] for counts in polygon_counts)
        
        for i, (polygon, counts) in enumerate(zip(polygons, polygon_counts)):
            f.write(f"VÙNG {i + 1}:\n")
            f.write(f"  Tọa độ: {polygon}\n")
            f.write(f"  Xe máy: {counts['bike']}\n")
            f.write(f"  Ô tô: {counts['car']}\n")
            f.write(f"  Tổng: {counts['total']}\n")
            f.write("-" * 40 + "\n")
        
        f.write(f"\nTỔNG KẾT:\n")
        f.write(f"Tổng xe máy: {total_bikes}\n")
        f.write(f"Tổng ô tô: {total_cars}\n")
        f.write(f"Tổng phương tiện: {total_bikes + total_cars}\n")

def process_frame_thread(model, class_names):
    """Thread xử lý frame để tối ưu hiệu suất"""
    global frame_queue
    
    while True:
        if not frame_queue.empty():
            frame_data = frame_queue.get()
            if frame_data is None:  # Signal to stop
                break
                
            frame, frame_id = frame_data
            
            # Dự đoán với YOLO
            results = model.predict(source=frame, device=0, save=False, verbose=False, conf=0.3)
            
            boxes = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                        class_id = box.cls[0].item()
                        confidence = box.conf[0].item()
                        boxes.append([x_min, y_min, x_max, y_max, class_id, confidence])
            
            # Lưu kết quả vào frame_data
            frame_data.append(boxes)

def draw_overlay(frame, boxes, polygons, current_polygon, polygon_counts, class_names, fps, processing_time):
    """Vẽ tất cả overlay lên frame"""
    height, width = frame.shape[:2]
    overlay = frame.copy()
    
    # Vẽ bounding boxes
    for box in boxes:
        x_min, y_min, x_max, y_max, class_id, confidence = box
        if int(class_id) < len(class_names):
            class_name = class_names[int(class_id)]
            
            # Chọn màu theo loại xe
            if class_name in ['bike', 'motorcycle']:
                color = (0, 255, 255)  # Vàng cho xe máy
            elif class_name in ['car', 'truck', 'bus']:
                color = (0, 0, 255)    # Đỏ cho ô tô
            else:
                color = (255, 0, 0)    # Xanh cho khác
            
            # Vẽ bounding box
            cv2.rectangle(overlay, (int(x_min), int(y_min)), (int(x_max), int(y_max)), color, 2)
            
            # Vẽ label với confidence
            label = f"{class_name}: {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
            cv2.rectangle(overlay, (int(x_min), int(y_min) - label_size[1] - 10),
                         (int(x_min) + label_size[0], int(y_min)), color, -1)
            cv2.putText(overlay, label, (int(x_min), int(y_min) - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    # Vẽ các đa giác đã hoàn thành
    for i, polygon in enumerate(polygons):
        if len(polygon) >= 3:
            pts = np.array(polygon, dtype=np.int32)
            # Vẽ đa giác với alpha blending
            cv2.fillPoly(overlay, [pts], (0, 255, 0), lineType=cv2.LINE_AA)
            cv2.polylines(overlay, [pts], True, (0, 255, 0), 3)
            
            # Vẽ label cho đa giác
            centroid_x = int(np.mean([p[0] for p in polygon]))
            centroid_y = int(np.mean([p[1] for p in polygon]))
            cv2.putText(overlay, f"Zone {i+1}", (centroid_x-30, centroid_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    # Vẽ đa giác đang vẽ
    if current_polygon and len(current_polygon) > 1:
        pts = np.array(current_polygon, dtype=np.int32)
        cv2.polylines(overlay, [pts], False, (255, 255, 0), 2)
        for point in current_polygon:
            cv2.circle(overlay, point, 5, (255, 255, 0), -1)
    
    # Alpha blending cho transparency
    alpha = 0.7
    frame = cv2.addWeighted(frame, alpha, overlay, 1-alpha, 0)
    
    # Vẽ thông tin thống kê
    y_offset = 30
    
    # Hiển thị thông tin hệ thống
    cv2.putText(frame, f"FPS: {fps:.1f}", (width - 150, y_offset),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    y_offset += 25
    cv2.putText(frame, f"Process: {processing_time:.1f}ms", (width - 200, y_offset),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
    y_offset += 25
    
    # Thêm thông tin debug
    cv2.putText(frame, f"Frame: {width}x{height}", (width - 200, y_offset),
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    y_offset += 20
    
    # Hiển thị số lượng xe cho từng vùng
    total_counts = {'bike': 0, 'car': 0}
    for i, counts in enumerate(polygon_counts):
        total_counts['bike'] += counts['bike']
        total_counts['car'] += counts['car']
        
        info_text = f"Zone {i+1}: M={counts['bike']}, Car={counts['car']}"
        cv2.putText(frame, info_text, (10, 30 + i * 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    # Hiển thị tổng số lượng
    y_total_start = 30 + len(polygon_counts) * 25 + 10
    cv2.putText(frame, f"TOTAL - Bikes: {total_counts['bike']}", (10, y_total_start),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.putText(frame, f"TOTAL - Cars: {total_counts['car']}", (10, y_total_start + 25),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    
    # Hiển thị hướng dẫn
    guide_y = height - 80
    cv2.putText(frame, "Controls: Q-Quit | S-Save | Left Click-Add Point | Right Click-Finish Polygon",
               (10, guide_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.putText(frame, "Drawing: Click points to create polygon, right-click when done",
               (10, guide_y + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    return frame

def main():
    global current_frame, polygons, current_polygon, frame_with_overlay
    
    print("=== TRAFFIC DETECTION VIDEO PROCESSOR ===")
    print("Kiểm tra GPU...")
    
    # Kiểm tra GPU
    if torch.cuda.is_available():
        print(f"✓ GPU khả dụng: {torch.cuda.get_device_name()}")
        device = 0
    else:
        print("⚠ GPU không khả dụng, sử dụng CPU")
        device = 'cpu'
    
    # Load model YOLO
    print("Đang tải model YOLO...")
    try:
        model = YOLO(r"D:\PROJECTS\Traffic Detection using YOLO\runs\train\exp\weights\best.pt")
        print("✓ Model đã được tải thành công")
    except Exception as e:
        print(f"✗ Lỗi tải model: {e}")
        return
    
    # Đường dẫn video - THAY ĐỔI ĐƯỜNG DẪN NÀY
    video_path = input("Nhập đường dẫn video (hoặc 0 cho webcam): ").strip()
    
    if video_path == "0":
        source = 0
        print("Sử dụng webcam...")
    else:
        source = video_path
        print(f"Sử dụng video: {source}")
    
    # Mở video
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("✗ Không thể mở video!")
        return
    
    # Lấy thông tin video
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if original_fps <= 0:
        original_fps = 30
    
    print(f"✓ Video info: {width}x{height}, {original_fps:.1f} FPS, {total_frames} frames")
    
    # Tối ưu FPS - điều chỉnh để không bị tua nhanh
    target_fps = min(original_fps, 25)  # Giới hạn tối đa 25 FPS
    target_fps = max(target_fps, 10)    # Tối thiểu 10 FPS
    frame_delay = 1.0 / target_fps
    
    print(f"✓ Target FPS: {target_fps:.1f}")
    print(f"✓ Frame delay: {frame_delay:.3f}s")
    
    # Tạo cửa sổ và gắn sự kiện chuột
    cv2.namedWindow('Traffic Detection - Video', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Traffic Detection - Video', min(1280, width), min(720, height))
    cv2.setMouseCallback('Traffic Detection - Video', draw_polygon)
    
    # Lấy tên các lớp từ model
    class_names = model.names
    print(f"✓ Classes: {class_names}")
    
    # Biến theo dõi hiệu suất
    fps_counter = 0
    fps_start_time = time.time()
    current_fps = 0
    last_frame_time = time.time()
    
    print("\n=== BẮT ĐẦU XỬ LÝ VIDEO ===")
    print("Hướng dẫn:")
    print("- Click chuột trái để thêm điểm vào đa giác")
    print("- Click chuột phải để hoàn thành đa giác")
    print("- Nhấn 'S' để lưu kết quả")
    print("- Nhấn 'Q' để thoát")
    
    try:
        frame_id = 0
        # Giảm skip frames để video không bị tua nhanh
        skip_frames = max(1, int(original_fps / target_fps)) if original_fps > target_fps else 1
        print(f"✓ Skip frames: {skip_frames}")
        
        while cap.isOpened():
            current_time = time.time()
            
            # Đọc frame
            ret, frame = cap.read()
            if not ret:
                print("Hết video hoặc lỗi đọc frame")
                break
            
            frame_id += 1
            
            # Chỉ skip frames khi FPS gốc cao hơn target
            if skip_frames > 1 and frame_id % skip_frames != 0:
                continue
            
            current_frame = frame.copy()
            
            # Tính thời gian xử lý
            process_start = time.time()
            
            # Dự đoán với YOLO - tăng confidence để giảm tải
            results = model.predict(source=current_frame, device=device, save=False, 
                                  verbose=False, conf=0.3, iou=0.5)
            
            # Trích xuất boxes
            boxes = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                        class_id = box.cls[0].item()
                        confidence = box.conf[0].item()
                        boxes.append([x_min, y_min, x_max, y_max, class_id, confidence])
            
            # Đếm xe trong các đa giác
            polygon_counts = count_vehicles_in_polygons(boxes, polygons, class_names)
            
            processing_time = (time.time() - process_start) * 1000
            
            # Vẽ overlay
            frame_with_overlay = draw_overlay(current_frame, boxes, polygons, current_polygon, 
                                            polygon_counts, class_names, current_fps, processing_time)
            
            # Hiển thị frame
            cv2.imshow('Traffic Detection - Video', frame_with_overlay)
            
            # Tính FPS thực tế
            fps_counter += 1
            if time.time() - fps_start_time >= 1.0:
                current_fps = fps_counter / (time.time() - fps_start_time)
                fps_counter = 0
                fps_start_time = time.time()
            
            # Điều khiển timing chính xác để không bị tua nhanh
            elapsed = time.time() - current_time
            remaining_time = frame_delay - elapsed
            
            if remaining_time > 0:
                # Đợi đủ thời gian để duy trì FPS đúng
                wait_time = max(1, int(remaining_time * 1000))
            else:
                wait_time = 1
            
            # Xử lý phím nhấn
            key = cv2.waitKey(wait_time) & 0xFF
            if key == ord('q') or key == 27:  # Q hoặc ESC
                print("Đang thoát...")
                break
            elif key == ord('s'):
                if polygons:
                    print("Đang lưu kết quả...")
                    save_predictions(polygons, polygon_counts)
                    print("✓ Đã lưu kết quả vào predict_video.txt")
                else:
                    print("⚠ Chưa có đa giác nào để lưu!")
            elif key == ord('c'):
                # Clear all polygons
                polygons.clear()
                current_polygon.clear()
                print("✓ Đã xóa tất cả đa giác")
            elif key == ord('h'):
                print("\n=== HƯỚNG DẪN SỬ DỤNG ===")
                print("Q/ESC: Thoát")
                print("S: Lưu kết quả")
                print("C: Xóa tất cả đa giác")
                print("H: Hiển thị hướng dẫn")
                print("Click trái: Thêm điểm đa giác")
                print("Click phải: Hoàn thành đa giác")
    
    except KeyboardInterrupt:
        print("\nNgười dùng dừng chương trình")
    except Exception as e:
        print(f"Lỗi: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
        # Tự động lưu kết quả cuối cùng nếu có đa giác
        if polygons:
            print("Đang tự động lưu kết quả cuối cùng...")
            polygon_counts = count_vehicles_in_polygons([], polygons, class_names)
            save_predictions(polygons, polygon_counts)
            print("✓ Đã lưu kết quả cuối cùng")
        
        print("=== KẾT THÚC ===")

if __name__ == "__main__":
    main()
