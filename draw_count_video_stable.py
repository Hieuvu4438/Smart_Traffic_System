from ultralytics import YOLO
import cv2
import numpy as np
import torch
import time

# Biến toàn cục
polygons = []
current_polygon = []
drawing = False
current_frame = None

def draw_polygon(event, x, y, flags, param):
    global drawing, current_polygon, polygons, current_frame
    
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
    if len(polygon) < 3:
        return False
    box_center_x = (box[0] + box[2]) / 2
    box_center_y = (box[1] + box[3]) / 2
    polygon_np = np.array(polygon, dtype=np.int32)
    return cv2.pointPolygonTest(polygon_np, (box_center_x, box_center_y), False) >= 0

def count_vehicles_in_polygons(boxes, polygons, class_names):
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

def main():
    global current_frame, polygons, current_polygon
    
    print("=== TRAFFIC DETECTION VIDEO (FPS STABLE) ===")
    
    # Kiểm tra GPU
    if torch.cuda.is_available():
        print(f"✓ GPU: {torch.cuda.get_device_name()}")
        device = 0
    else:
        print("⚠ Sử dụng CPU")
        device = 'cpu'
    
    # Load model
    try:
        model = YOLO(r"D:\PROJECTS\Traffic Detection using YOLO\runs\train\exp\weights\best.pt")
        print("✓ Model loaded")
    except Exception as e:
        print(f"✗ Model error: {e}")
        return
    
    # Input video
    video_path = input("Video path (hoặc '0' cho webcam): ").strip()
    source = 0 if video_path == "0" else video_path
    
    # Open video
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("✗ Không thể mở video!")
        return
    
    # Video info
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    if original_fps <= 0:
        original_fps = 30
    
    print(f"✓ Video: {width}x{height} @ {original_fps:.1f} FPS")
    
    # Set target FPS - GIẢM ĐỂ TRÁNH TUA NHANH
    TARGET_FPS = 15  # Cố định 15 FPS
    frame_time = 1.0 / TARGET_FPS
    
    print(f"✓ Target FPS: {TARGET_FPS}")
    print(f"✓ Frame time: {frame_time:.3f}s")
    
    # Setup window
    cv2.namedWindow('Traffic Detection', cv2.WINDOW_NORMAL)
    cv2.setMouseCallback('Traffic Detection', draw_polygon)
    cv2.resizeWindow('Traffic Detection', min(1280, width), min(720, height))
    
    class_names = model.names
    
    # Performance tracking
    fps_counter = 0
    fps_start = time.time()
    current_fps = 0
    
    print("\n=== STARTED ===")
    print("Controls: Q-Quit | S-Save | C-Clear | Left click-Add point | Right click-Finish")
    
    frame_count = 0
    last_time = time.time()
    
    try:
        while True:
            loop_start = time.time()
            
            # Read frame
            ret, frame = cap.read()
            if not ret:
                print("Video ended")
                break
            
            frame_count += 1
            current_frame = frame.copy()
            
            # YOLO prediction
            results = model.predict(source=current_frame, device=device, 
                                  save=False, verbose=False, conf=0.3)
            
            # Extract boxes
            boxes = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                        class_id = box.cls[0].item()
                        confidence = box.conf[0].item()
                        boxes.append([x_min, y_min, x_max, y_max, class_id, confidence])
            
            # Count vehicles
            polygon_counts = count_vehicles_in_polygons(boxes, polygons, class_names)
            
            # Draw everything
            display_frame = current_frame.copy()
            
            # Draw bounding boxes
            for box in boxes:
                x_min, y_min, x_max, y_max, class_id, conf = box
                if int(class_id) < len(class_names):
                    class_name = class_names[int(class_id)]
                    color = (0, 255, 255) if class_name in ['bike', 'motorcycle'] else (0, 0, 255)
                    
                    cv2.rectangle(display_frame, (int(x_min), int(y_min)), 
                                (int(x_max), int(y_max)), color, 2)
                    cv2.putText(display_frame, f"{class_name}: {conf:.2f}", 
                              (int(x_min), int(y_min) - 5),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Draw polygons
            for i, polygon in enumerate(polygons):
                if len(polygon) >= 3:
                    pts = np.array(polygon, dtype=np.int32)
                    cv2.polylines(display_frame, [pts], True, (0, 255, 0), 2)
                    
                    # Centroid label
                    cx = int(np.mean([p[0] for p in polygon]))
                    cy = int(np.mean([p[1] for p in polygon]))
                    cv2.putText(display_frame, f"Zone {i+1}", (cx-30, cy),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Draw current polygon
            if current_polygon and len(current_polygon) > 1:
                pts = np.array(current_polygon, dtype=np.int32)
                cv2.polylines(display_frame, [pts], False, (255, 255, 0), 2)
                for point in current_polygon:
                    cv2.circle(display_frame, point, 4, (255, 255, 0), -1)
            
            # Display stats
            total_bikes = sum(counts['bike'] for counts in polygon_counts)
            total_cars = sum(counts['car'] for counts in polygon_counts)
            
            # Zone counts
            for i, counts in enumerate(polygon_counts):
                cv2.putText(display_frame, f"Zone {i+1}: B={counts['bike']}, C={counts['car']}", 
                          (10, 30 + i * 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Total counts
            y_start = 30 + len(polygon_counts) * 25 + 10
            cv2.putText(display_frame, f"TOTAL - Bikes: {total_bikes}", 
                      (10, y_start), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(display_frame, f"TOTAL - Cars: {total_cars}", 
                      (10, y_start + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Performance info
            cv2.putText(display_frame, f"FPS: {current_fps:.1f}", 
                      (width - 120, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(display_frame, f"Frame: {frame_count}", 
                      (width - 120, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Show frame
            cv2.imshow('Traffic Detection', display_frame)
            
            # Calculate FPS
            fps_counter += 1
            if time.time() - fps_start >= 1.0:
                current_fps = fps_counter / (time.time() - fps_start)
                fps_counter = 0
                fps_start = time.time()
            
            # TIMING CONTROL - ĐÂY LÀ PHẦN QUAN TRỌNG
            elapsed = time.time() - loop_start
            sleep_time = frame_time - elapsed
            
            if sleep_time > 0:
                # Chờ để duy trì FPS ổn định
                time.sleep(sleep_time)
                wait_key_time = 1
            else:
                wait_key_time = 1
            
            # Handle keys
            key = cv2.waitKey(wait_key_time) & 0xFF
            if key == ord('q') or key == 27:
                break
            elif key == ord('s'):
                if polygons:
                    filename = f"result_{int(time.time())}.txt"
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(f"Video: {video_path}\n")
                        f.write(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                        f.write(f"Total Bikes: {total_bikes}\n")
                        f.write(f"Total Cars: {total_cars}\n\n")
                        for i, (poly, counts) in enumerate(zip(polygons, polygon_counts)):
                            f.write(f"Zone {i+1}: {poly}\n")
                            f.write(f"  Bikes: {counts['bike']}, Cars: {counts['car']}\n\n")
                    print(f"✓ Saved to {filename}")
                else:
                    print("⚠ No zones to save!")
            elif key == ord('c'):
                polygons.clear()
                current_polygon.clear()
                print("✓ Cleared all zones")
    
    except KeyboardInterrupt:
        print("\nUser interrupted")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("=== FINISHED ===")

if __name__ == "__main__":
    main()
