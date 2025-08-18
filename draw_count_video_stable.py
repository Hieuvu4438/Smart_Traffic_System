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

def get_density_color(total_vehicles):
    """Trả về màu và trạng thái dựa trên mật độ xe"""
    if total_vehicles <= 5:
        return (0, 255, 0), "Ổn định"  # Xanh lá
    else:
        return (0, 0, 255), "Ùn tắc"   # Đỏ

def get_vehicle_classes():
    """Định nghĩa các class phương tiện từ COCO dataset (YOLOv8)"""
    return {
        2: 'car',       # ô tô
        3: 'motorcycle', # xe máy  
        5: 'bus',       # xe buýt
        7: 'truck'      # xe tải
    }

def get_vehicle_color(class_name):
    """Trả về màu cho từng loại phương tiện"""
    colors = {
        'car': (0, 0, 255),        # Đỏ
        'motorcycle': (0, 255, 255), # Vàng
        'bus': (255, 0, 0),        # Xanh dương
        'truck': (255, 0, 255)     # Tím
    }
    return colors.get(class_name, (255, 255, 255))

def draw_heatmap_on_polygon(frame, polygon, density_info):
    """Vẽ heatmap lên polygon với độ trong suốt"""
    if len(polygon) < 3:
        return
    
    # Tạo mask cho polygon
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    pts = np.array(polygon, dtype=np.int32)
    cv2.fillPoly(mask, [pts], 255)
    
    # Tạo overlay với màu tương ứng
    overlay = frame.copy()
    color = density_info['color']
    overlay[mask == 255] = color
    
    # Áp dụng độ trong suốt (alpha blending)
    alpha = 0.3  # Độ trong suốt 30%
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

def count_vehicles_in_polygons(boxes, polygons, class_names):
    vehicle_classes = get_vehicle_classes()
    polygon_counts = []
    
    for polygon in polygons:
        counts = {
            'car': 0,
            'motorcycle': 0, 
            'bus': 0,
            'truck': 0,
            'total': 0
        }
        
        for box in boxes:
            if is_vehicle_in_polygon(box, polygon):
                class_id = int(box[4])
                
                # Chỉ đếm các phương tiện giao thông
                if class_id in vehicle_classes:
                    vehicle_type = vehicle_classes[class_id]
                    counts[vehicle_type] += 1
                    counts['total'] += 1
        
        # Thêm thông tin mật độ và màu
        color, status = get_density_color(counts['total'])
        counts['color'] = color
        counts['status'] = status
        counts['density_level'] = "HIGH" if counts['total'] > 5 else "LOW"
        
        polygon_counts.append(counts)
    return polygon_counts

def main():
    global current_frame, polygons, current_polygon
    
    print("=== TRAFFIC DETECTION VIDEO (FPS STABLE) ===")
    
    # Kiểm tra GPU - FORCE CPU để tránh lỗi torchvision::nms
    if torch.cuda.is_available():
        print(f"✓ GPU available: {torch.cuda.get_device_name()}")
        print("⚠ Using CPU for stability (avoiding CUDA/torchvision compatibility issues)")
        device = 'cpu'  # Force CPU cho ổn định
    else:
        print("⚠ Sử dụng CPU")
        device = 'cpu'
    
    # Load YOLOv8 pre-trained model (thay vì custom model)
    try:
        model = YOLO('yolo12n.pt')  # Sử dụng YOLOv8 nano - tự động download nếu chưa có
        print("✓ YOLOv12 model loaded")
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
    print("Vehicle Detection: Car (Red) | Motorcycle (Yellow) | Truck (Purple) | Bus (Blue)")
    print("Heatmap: Green=Stable (≤5 vehicles) | Red=Congested (>5 vehicles)")
    print("Density is calculated per zone and visualized with transparent color overlay")
    
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
            
            # YOLO prediction với error handling
            try:
                results = model.predict(source=current_frame, device=device, 
                                      save=False, verbose=False, conf=0.3)
            except Exception as e:
                print(f"⚠ GPU Error: {e}")
                print("🔄 Switching to CPU...")
                device = 'cpu'
                model = model.to('cpu')
                results = model.predict(source=current_frame, device=device, 
                                      save=False, verbose=False, conf=0.3)
            
            # Extract boxes - chỉ lấy phương tiện giao thông
            vehicle_classes = get_vehicle_classes()
            boxes = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        class_id = int(box.cls[0].item())
                        # Chỉ lấy các phương tiện giao thông
                        if class_id in vehicle_classes:
                            x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                            confidence = box.conf[0].item()
                            boxes.append([x_min, y_min, x_max, y_max, class_id, confidence])
            
            # Count vehicles
            polygon_counts = count_vehicles_in_polygons(boxes, polygons, class_names)
            
            # Draw everything
            display_frame = current_frame.copy()
            
            # Vẽ heatmap trước (dưới cùng)
            for i, (polygon, counts) in enumerate(zip(polygons, polygon_counts)):
                if len(polygon) >= 3:
                    draw_heatmap_on_polygon(display_frame, polygon, counts)
            
            # Draw bounding boxes với màu theo loại phương tiện
            vehicle_classes = get_vehicle_classes()
            for box in boxes:
                x_min, y_min, x_max, y_max, class_id, conf = box
                if int(class_id) in vehicle_classes:
                    vehicle_type = vehicle_classes[int(class_id)]
                    color = get_vehicle_color(vehicle_type)
                    
                    cv2.rectangle(display_frame, (int(x_min), int(y_min)), 
                                (int(x_max), int(y_max)), color, 2)
                    cv2.putText(display_frame, f"{vehicle_type}: {conf:.2f}", 
                              (int(x_min), int(y_min) - 5),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Draw polygon borders và labels
            for i, (polygon, counts) in enumerate(zip(polygons, polygon_counts)):
                if len(polygon) >= 3:
                    pts = np.array(polygon, dtype=np.int32)
                    # Vẽ viền polygon với màu trạng thái
                    border_color = counts['color']
                    cv2.polylines(display_frame, [pts], True, border_color, 3)
                    
                    # Centroid với thông tin chi tiết
                    cx = int(np.mean([p[0] for p in polygon]))
                    cy = int(np.mean([p[1] for p in polygon]))
                    
                    # Background cho text với thông tin chi tiết
                    text_bg_color = (0, 0, 0)  # Đen
                    cv2.rectangle(display_frame, (cx-60, cy-50), (cx+60, cy+40), text_bg_color, -1)
                    
                    # Zone label
                    cv2.putText(display_frame, f"Zone {i+1}", (cx-55, cy-35),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    # Status
                    cv2.putText(display_frame, f"{counts['status']}", (cx-55, cy-20),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.4, counts['color'], 1)
                    # Vehicle counts chi tiết
                    cv2.putText(display_frame, f"Total: {counts['total']}", (cx-55, cy-5),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)
                    cv2.putText(display_frame, f"Car:{counts['car']} Truck:{counts['truck']}", (cx-55, cy+10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)
                    cv2.putText(display_frame, f"Moto:{counts['motorcycle']} Bus:{counts['bus']}", (cx-55, cy+25),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)
            
            # Draw current polygon
            if current_polygon and len(current_polygon) > 1:
                pts = np.array(current_polygon, dtype=np.int32)
                cv2.polylines(display_frame, [pts], False, (255, 255, 0), 2)
                for point in current_polygon:
                    cv2.circle(display_frame, point, 4, (255, 255, 0), -1)
            
            # Display stats với thông tin mật độ chi tiết
            total_cars = sum(counts['car'] for counts in polygon_counts)
            total_motorcycles = sum(counts['motorcycle'] for counts in polygon_counts)
            total_trucks = sum(counts['truck'] for counts in polygon_counts)
            total_buses = sum(counts['bus'] for counts in polygon_counts)
            total_vehicles = sum(counts['total'] for counts in polygon_counts)
            total_stable_zones = sum(1 for counts in polygon_counts if counts['status'] == 'Ổn định')
            total_congested_zones = sum(1 for counts in polygon_counts if counts['status'] == 'Ùn tắc')
            
            # Zone counts với màu trạng thái và thông tin chi tiết
            for i, counts in enumerate(polygon_counts):
                status_color = counts['color']
                cv2.putText(display_frame, f"Zone {i+1} ({counts['status']}): Total={counts['total']}", 
                          (10, 30 + i * 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 2)
                cv2.putText(display_frame, f"  Car:{counts['car']} Truck:{counts['truck']} Moto:{counts['motorcycle']} Bus:{counts['bus']}", 
                          (10, 30 + i * 50 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Total counts theo từng loại
            y_start = 30 + len(polygon_counts) * 50 + 20
            cv2.putText(display_frame, f"TOTAL VEHICLES: {total_vehicles}", 
                      (10, y_start), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(display_frame, f"Cars: {total_cars}", 
                      (10, y_start + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            cv2.putText(display_frame, f"Motorcycles: {total_motorcycles}", 
                      (10, y_start + 45), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            cv2.putText(display_frame, f"Trucks: {total_trucks}", 
                      (10, y_start + 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)
            cv2.putText(display_frame, f"Buses: {total_buses}", 
                      (10, y_start + 85), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
            
            # Thống kê mật độ
            cv2.putText(display_frame, f"Zones: Stable={total_stable_zones}, Congested={total_congested_zones}", 
                      (10, y_start + 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Legend cho màu sắc phương tiện
            legend_y = y_start + 140
            cv2.putText(display_frame, "VEHICLE COLORS:", (10, legend_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Car - Đỏ
            cv2.rectangle(display_frame, (10, legend_y+10), (30, legend_y+20), (0, 0, 255), -1)
            cv2.putText(display_frame, "Car", (35, legend_y+18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Motorcycle - Vàng
            cv2.rectangle(display_frame, (80, legend_y+10), (100, legend_y+20), (0, 255, 255), -1)
            cv2.putText(display_frame, "Moto", (105, legend_y+18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Truck - Tím
            cv2.rectangle(display_frame, (150, legend_y+10), (170, legend_y+20), (255, 0, 255), -1)
            cv2.putText(display_frame, "Truck", (175, legend_y+18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Bus - Xanh dương
            cv2.rectangle(display_frame, (230, legend_y+10), (250, legend_y+20), (255, 0, 0), -1)
            cv2.putText(display_frame, "Bus", (255, legend_y+18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Density legend
            density_legend_y = legend_y + 35
            cv2.putText(display_frame, "DENSITY:", (10, density_legend_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.rectangle(display_frame, (80, density_legend_y+5), (100, density_legend_y+15), (0, 255, 0), -1)  # Xanh
            cv2.putText(display_frame, "Stable (≤5)", (105, density_legend_y+13), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            cv2.rectangle(display_frame, (200, density_legend_y+5), (220, density_legend_y+15), (0, 0, 255), -1)  # Đỏ
            cv2.putText(display_frame, "Congested (>5)", (225, density_legend_y+13), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Performance info
            cv2.putText(display_frame, f"FPS: {current_fps:.1f}", 
                      (width - 120, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(display_frame, f"Frame: {frame_count}", 
                      (width - 120, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(display_frame, f"Zones: {len(polygons)}", 
                      (width - 120, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
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
                        f.write(f"Total Cars: {total_cars}\n")
                        f.write(f"Total Motorcycles: {total_motorcycles}\n")
                        f.write(f"Total Trucks: {total_trucks}\n")
                        f.write(f"Total Buses: {total_buses}\n")
                        f.write(f"Total Vehicles: {total_vehicles}\n")
                        f.write(f"Stable Zones: {total_stable_zones}\n")
                        f.write(f"Congested Zones: {total_congested_zones}\n\n")
                        
                        for i, (poly, counts) in enumerate(zip(polygons, polygon_counts)):
                            f.write(f"Zone {i+1}: {poly}\n")
                            f.write(f"  Status: {counts['status']}\n")
                            f.write(f"  Density Level: {counts['density_level']}\n")
                            f.write(f"  Cars: {counts['car']}\n")
                            f.write(f"  Motorcycles: {counts['motorcycle']}\n")
                            f.write(f"  Trucks: {counts['truck']}\n")
                            f.write(f"  Buses: {counts['bus']}\n")
                            f.write(f"  Total: {counts['total']}\n\n")
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
