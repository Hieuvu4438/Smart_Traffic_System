import cv2
from ultralytics import YOLO
import pandas as pd
import numpy as np
import os
from datetime import datetime
import time
import json
from collections import defaultdict
import math

class AdaptiveTrafficMonitor:
    def __init__(self, video_path, model_path=None):
        # Initialize YOLO model
        if model_path is None:
            model_path = r"D:\PROJECTS\Traffic Detection using YOLO\yolov10n.pt"
        self.model = YOLO(model_path)
        
        # Load class names
        try:
            with open(r"D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\coco.txt", "r") as f:
                self.class_list = f.read().split("\n")
        except:
            # Fallback to default COCO classes
            self.class_list = ['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck']
        
        # Video setup
        self.cap = cv2.VideoCapture(video_path)
        self.video_name = os.path.splitext(os.path.basename(video_path))[0]
        
        # Get video properties
        self.original_fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.frame_delay = int(1000 / self.original_fps) if self.original_fps > 0 else 33
        
        # UI state
        self.polygon_points = []
        self.drawing_polygon = False
        self.polygon_complete = False
        self.traffic_light_regions = []
        self.selecting_traffic_light = False
        
        # Detection and tracking
        self.tracker = AdaptiveTracker()
        self.violation_list = []
        
        # Performance tracking
        self.fps_counter = 0
        self.start_time = time.time()
        self.fps_display = 0
        
        # Traffic light detection
        self.traffic_light_detector = TrafficLightDetector()
        self.current_light_state = "UNKNOWN"
        
        # Output setup
        self.setup_output_directory()
        
        # Configuration
        self.config = {
            'process_every_n_frames': 2,  # Process every 2nd frame for better performance
            'resize_width': 800,
            'resize_height': 480,
            'detection_confidence': 0.5,
            'track_distance_threshold': 50
        }
        
        print("=== Adaptive Traffic Monitor ===")
        print("Instructions:")
        print("1. Press 'p' to start drawing violation area polygon")
        print("2. Click mouse to add polygon points")
        print("3. Press 'p' again to finish polygon")
        print("4. Press 't' to select traffic light area")
        print("5. Press SPACE to start monitoring")
        print("6. Press 'r' to reset polygon")
        print("7. Press 's' to save configuration")
        print("8. Press 'l' to load configuration")
        print("9. Press 'q' to quit")

    def setup_output_directory(self):
        """Create output directory for saving violations"""
        today_date = datetime.now().strftime('%Y-%m-%d')
        self.output_dir = os.path.join('adaptive_violations', self.video_name, today_date)
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def mouse_callback(self, event, x, y, flags, param):
        """Handle mouse events for polygon drawing and traffic light selection"""
        if self.drawing_polygon:
            if event == cv2.EVENT_LBUTTONDOWN:
                self.polygon_points.append((x, y))
                print(f"Polygon point added: ({x}, {y})")
        
        elif self.selecting_traffic_light:
            if event == cv2.EVENT_LBUTTONDOWN:
                # Start selecting traffic light region
                self.temp_tl_start = (x, y)
            elif event == cv2.EVENT_LBUTTONUP:
                # Finish selecting traffic light region
                if hasattr(self, 'temp_tl_start'):
                    x1, y1 = self.temp_tl_start
                    x2, y2 = x, y
                    # Ensure proper rectangle coordinates
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    self.traffic_light_regions.append((x1, y1, x2, y2))
                    print(f"Traffic light region added: ({x1}, {y1}, {x2}, {y2})")
                    delattr(self, 'temp_tl_start')

    def draw_interface(self, frame):
        """Draw the user interface elements"""
        # Draw polygon
        if len(self.polygon_points) > 0:
            if self.polygon_complete and len(self.polygon_points) > 2:
                pts = np.array(self.polygon_points, np.int32)
                cv2.polylines(frame, [pts], True, (0, 255, 0), 2)
                cv2.fillPoly(frame, [pts], (0, 255, 0, 30))  # Semi-transparent fill
            else:
                # Draw incomplete polygon
                for i, point in enumerate(self.polygon_points):
                    cv2.circle(frame, point, 5, (255, 0, 0), -1)
                    cv2.putText(frame, str(i+1), (point[0]+10, point[1]), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
                
                # Draw lines between points
                if len(self.polygon_points) > 1:
                    for i in range(len(self.polygon_points) - 1):
                        cv2.line(frame, self.polygon_points[i], self.polygon_points[i+1], (255, 0, 0), 2)

        # Draw traffic light regions
        for i, (x1, y1, x2, y2) in enumerate(self.traffic_light_regions):
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
            cv2.putText(frame, f"TL{i+1}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        # Draw current drawing region if selecting traffic light
        if self.selecting_traffic_light and hasattr(self, 'temp_tl_start'):
            mouse_pos = cv2.getWindowProperty('Traffic Monitor', cv2.WND_PROP_AUTOSIZE)
            # This is a placeholder - in practice you'd track mouse position differently

        # Status information
        status_y = 30
        cv2.putText(frame, f'FPS: {self.fps_display:.1f}', (10, status_y), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        status_y += 25
        cv2.putText(frame, f'Light: {self.current_light_state}', (10, status_y), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        status_y += 25
        if self.drawing_polygon:
            cv2.putText(frame, 'Drawing polygon - Click to add points', (10, status_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)
        elif self.selecting_traffic_light:
            cv2.putText(frame, 'Select traffic light - Drag to select area', (10, status_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        elif not self.polygon_complete:
            cv2.putText(frame, 'Press P to draw violation area', (10, status_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        else:
            cv2.putText(frame, f'Monitoring active - Violations: {len(self.violation_list)}', 
                       (10, status_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    def detect_and_track_vehicles(self, frame):
        """Detect and track vehicles in the frame"""
        results = self.model(frame, conf=self.config['detection_confidence'])
        
        if len(results[0].boxes) == 0:
            return []

        # Convert results to format for tracker
        detections = []
        detection_classes = []
        
        boxes_data = results[0].boxes.data.cpu().numpy()
        for box_data in boxes_data:
            x1, y1, x2, y2, conf, cls_id = box_data
            cls_name = self.class_list[int(cls_id)] if int(cls_id) < len(self.class_list) else "unknown"
            
            # Only track vehicles
            if cls_name in ['car', 'truck', 'bus', 'motorcycle']:
                detections.append([int(x1), int(y1), int(x2), int(y2)])
                detection_classes.append(cls_name)
        
        # Update tracker
        tracked_objects = self.tracker.update(detections)
        
        return tracked_objects, detection_classes

    def check_violations(self, frame, tracked_objects, detection_classes):
        """Check for traffic violations"""
        if not self.polygon_complete or len(self.polygon_points) < 3:
            return

        violations = []
        polygon = np.array(self.polygon_points, np.int32)
        
        for i, bbox in enumerate(tracked_objects):
            if len(bbox) >= 5:
                x1, y1, x2, y2, obj_id = bbox
                cls_name = detection_classes[i] if i < len(detection_classes) else "unknown"
                
                # Calculate center point
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)
                
                # Check if vehicle is in violation area
                result = cv2.pointPolygonTest(polygon, (cx, cy), False)
                
                if result >= 0:  # Inside polygon
                    if self.current_light_state == "RED" and obj_id not in self.violation_list:
                        # Record violation
                        self.violation_list.append(obj_id)
                        self.save_violation_image(frame, obj_id, cls_name, cx, cy)
                        violations.append((obj_id, cls_name, cx, cy))
                        print(f"VIOLATION DETECTED: {cls_name} ID:{obj_id} at ({cx}, {cy})")
                    
                    # Draw bounding box
                    color = (0, 0, 255) if self.current_light_state == "RED" else (0, 255, 0)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f'{cls_name} ID:{obj_id}', (x1, y1-10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                    cv2.circle(frame, (cx, cy), 4, color, -1)

    def save_violation_image(self, frame, obj_id, cls_name, cx, cy):
        """Save violation image with metadata"""
        timestamp = datetime.now().strftime('%H-%M-%S-%f')[:-3]
        filename = f"violation_{cls_name}_{obj_id}_{timestamp}.jpg"
        filepath = os.path.join(self.output_dir, filename)
        
        # Add violation metadata to the image
        violation_frame = frame.copy()
        cv2.putText(violation_frame, f"VIOLATION: {cls_name} ID:{obj_id}", 
                   (10, frame.shape[0] - 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.putText(violation_frame, f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 
                   (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        cv2.imwrite(filepath, violation_frame)

    def save_configuration(self):
        """Save current configuration to file"""
        config_data = {
            'polygon_points': self.polygon_points,
            'traffic_light_regions': self.traffic_light_regions,
            'video_name': self.video_name,
            'config': self.config
        }
        
        config_file = f"config_{self.video_name}.json"
        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        print(f"Configuration saved to {config_file}")

    def load_configuration(self):
        """Load configuration from file"""
        config_file = f"config_{self.video_name}.json"
        try:
            with open(config_file, 'r') as f:
                config_data = json.load(f)
            
            self.polygon_points = config_data.get('polygon_points', [])
            self.traffic_light_regions = config_data.get('traffic_light_regions', [])
            self.config.update(config_data.get('config', {}))
            
            if len(self.polygon_points) > 2:
                self.polygon_complete = True
            
            print(f"Configuration loaded from {config_file}")
            return True
        except FileNotFoundError:
            print(f"No configuration file found: {config_file}")
            return False

    def run(self):
        """Main execution loop"""
        cv2.namedWindow('Traffic Monitor')
        cv2.setMouseCallback('Traffic Monitor', self.mouse_callback)
        
        # Try to load existing configuration
        self.load_configuration()
        
        count = 0
        monitoring_active = False
        
        print(f"\nVideo: {self.video_name}")
        print(f"Original FPS: {self.original_fps}")
        print("Setup phase - configure areas before monitoring")
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("End of video or read error")
                break
            
            count += 1
            
            # Calculate FPS
            self.fps_counter += 1
            if self.fps_counter % 10 == 0:
                end_time = time.time()
                if end_time - self.start_time > 0:
                    self.fps_display = 10 / (end_time - self.start_time)
                self.start_time = end_time
            
            # Resize frame
            frame = cv2.resize(frame, (self.config['resize_width'], self.config['resize_height']))
            
            # Only process detection every N frames when monitoring is active
            if monitoring_active and count % self.config['process_every_n_frames'] == 0:
                # Detect traffic light state
                self.current_light_state = self.traffic_light_detector.detect_light_state(
                    frame, self.traffic_light_regions)
                
                # Detect and track vehicles
                tracked_objects, detection_classes = self.detect_and_track_vehicles(frame)
                
                # Check for violations
                self.check_violations(frame, tracked_objects, detection_classes)
            
            # Draw interface
            self.draw_interface(frame)
            
            cv2.imshow('Traffic Monitor', frame)
            
            # Handle key presses
            key = cv2.waitKey(self.frame_delay) & 0xFF
            
            if key == ord('q'):
                break
            elif key == ord('p'):
                if not self.drawing_polygon:
                    self.polygon_points = []
                    self.drawing_polygon = True
                    self.polygon_complete = False
                    print("Start drawing polygon - click to add points")
                else:
                    if len(self.polygon_points) >= 3:
                        self.drawing_polygon = False
                        self.polygon_complete = True
                        print(f"Polygon completed with {len(self.polygon_points)} points")
                    else:
                        print("Need at least 3 points for polygon")
            elif key == ord('t'):
                self.selecting_traffic_light = not self.selecting_traffic_light
                if self.selecting_traffic_light:
                    print("Traffic light selection mode - drag to select area")
                else:
                    print("Traffic light selection mode OFF")
            elif key == ord(' '):
                if self.polygon_complete:
                    monitoring_active = not monitoring_active
                    if monitoring_active:
                        print("MONITORING STARTED")
                        self.violation_list = []  # Reset violations
                    else:
                        print("MONITORING PAUSED")
                else:
                    print("Please complete polygon setup first")
            elif key == ord('r'):
                self.polygon_points = []
                self.polygon_complete = False
                self.drawing_polygon = False
                self.violation_list = []
                print("Reset complete")
            elif key == ord('s'):
                self.save_configuration()
            elif key == ord('l'):
                self.load_configuration()
        
        self.cap.release()
        cv2.destroyAllWindows()
        
        print(f"\nSession Summary:")
        print(f"Total violations detected: {len(self.violation_list)}")
        print(f"Violations saved to: {self.output_dir}")


class AdaptiveTracker:
    """Improved tracker that adapts to different scenarios"""
    def __init__(self, max_disappeared=10, max_distance=50):
        self.next_id = 0
        self.objects = {}
        self.disappeared = {}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def update(self, detections):
        if len(detections) == 0:
            # Mark existing objects as disappeared
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return []

        input_centroids = []
        for detection in detections:
            x1, y1, x2, y2 = detection
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)
            input_centroids.append((cx, cy))

        if len(self.objects) == 0:
            for centroid in input_centroids:
                self.register(centroid)
        else:
            object_centroids = list(self.objects.values())
            
            # Compute distance matrix
            D = np.linalg.norm(np.array(object_centroids)[:, np.newaxis] - input_centroids, axis=2)
            
            # Find minimum distance matches
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]
            
            used_row_indices = set()
            used_col_indices = set()
            
            for (row, col) in zip(rows, cols):
                if row in used_row_indices or col in used_col_indices:
                    continue
                
                if D[row, col] <= self.max_distance:
                    object_id = list(self.objects.keys())[row]
                    self.objects[object_id] = input_centroids[col]
                    if object_id in self.disappeared:
                        del self.disappeared[object_id]
                    
                    used_row_indices.add(row)
                    used_col_indices.add(col)

            unused_row_indices = set(range(0, D.shape[0])).difference(used_row_indices)
            unused_col_indices = set(range(0, D.shape[1])).difference(used_col_indices)

            if D.shape[0] >= D.shape[1]:
                for row in unused_row_indices:
                    object_id = list(self.objects.keys())[row]
                    self.disappeared.setdefault(object_id, 0)
                    self.disappeared[object_id] += 1
                    
                    if self.disappeared[object_id] > self.max_disappeared:
                        self.deregister(object_id)
            else:
                for col in unused_col_indices:
                    self.register(input_centroids[col])

        # Return tracked objects in bbox format
        tracked_objects = []
        for i, detection in enumerate(detections):
            if i < len(input_centroids):
                # Find which object this detection corresponds to
                centroid = input_centroids[i]
                object_id = None
                min_dist = float('inf')
                
                for oid, obj_centroid in self.objects.items():
                    dist = np.linalg.norm(np.array(centroid) - np.array(obj_centroid))
                    if dist < min_dist and dist <= self.max_distance:
                        min_dist = dist
                        object_id = oid
                
                if object_id is not None:
                    x1, y1, x2, y2 = detection
                    tracked_objects.append([x1, y1, x2, y2, object_id])

        return tracked_objects

    def register(self, centroid):
        self.objects[self.next_id] = centroid
        self.disappeared[self.next_id] = 0
        self.next_id += 1

    def deregister(self, object_id):
        del self.objects[object_id]
        if object_id in self.disappeared:
            del self.disappeared[object_id]


class TrafficLightDetector:
    """Adaptive traffic light detector"""
    def __init__(self):
        self.light_history = defaultdict(list)
        self.history_length = 5

    def detect_light_state(self, frame, regions):
        """Detect traffic light state from specified regions"""
        if not regions:
            return "UNKNOWN"
        
        states = []
        for region in regions:
            x1, y1, x2, y2 = region
            roi = frame[y1:y2, x1:x2]
            
            if roi.size > 0:
                state = self.analyze_roi(roi)
                states.append(state)
        
        # Return most common state
        if states:
            from collections import Counter
            most_common = Counter(states).most_common(1)[0][0]
            return most_common
        
        return "UNKNOWN"

    def analyze_roi(self, roi):
        """Analyze ROI to determine light state"""
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        
        # Define color ranges for traffic lights
        red_lower1 = np.array([0, 50, 50])
        red_upper1 = np.array([10, 255, 255])
        red_lower2 = np.array([170, 50, 50])
        red_upper2 = np.array([180, 255, 255])
        
        green_lower = np.array([40, 50, 50])
        green_upper = np.array([80, 255, 255])
        
        yellow_lower = np.array([15, 50, 50])
        yellow_upper = np.array([35, 255, 255])
        
        # Create masks
        red_mask1 = cv2.inRange(hsv, red_lower1, red_upper1)
        red_mask2 = cv2.inRange(hsv, red_lower2, red_upper2)
        red_mask = cv2.bitwise_or(red_mask1, red_mask2)
        
        green_mask = cv2.inRange(hsv, green_lower, green_upper)
        yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)
        
        # Count pixels
        red_pixels = cv2.countNonZero(red_mask)
        green_pixels = cv2.countNonZero(green_mask)
        yellow_pixels = cv2.countNonZero(yellow_mask)
        
        # Determine state based on pixel counts
        total_pixels = roi.shape[0] * roi.shape[1]
        threshold = total_pixels * 0.05  # 5% threshold
        
        if red_pixels > threshold and red_pixels > green_pixels and red_pixels > yellow_pixels:
            return "RED"
        elif green_pixels > threshold and green_pixels > red_pixels:
            return "GREEN"
        elif yellow_pixels > threshold:
            return "YELLOW"
        
        return "UNKNOWN"


def main():
    print("=== Adaptive Traffic Monitor ===")
    print("Select video file:")
    
    # Default video options
    video_options = [
        r'D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\tr.mp4',
        r'D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\16h15.5.9.22.mp4'
    ]
    
    print("Available videos:")
    for i, video in enumerate(video_options):
        if os.path.exists(video):
            print(f"{i+1}. {os.path.basename(video)}")
    
    print(f"{len(video_options)+1}. Enter custom path")
    
    try:
        choice = int(input("Select video (1-3): ")) - 1
        
        if choice < len(video_options):
            video_path = video_options[choice]
        else:
            video_path = input("Enter video path: ").strip().strip('"')
        
        if not os.path.exists(video_path):
            print(f"Video not found: {video_path}")
            return
        
        # Initialize and run monitor
        monitor = AdaptiveTrafficMonitor(video_path)
        monitor.run()
        
    except (ValueError, KeyboardInterrupt):
        print("Cancelled or invalid input")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
