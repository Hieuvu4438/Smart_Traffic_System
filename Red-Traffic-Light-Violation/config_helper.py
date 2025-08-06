"""
Configuration and Testing Helper for Adaptive Traffic Monitor
Công cụ hỗ trợ cấu hình và test cho hệ thống giám sát giao thông thích ứng
"""

import cv2
import json
import os
import numpy as np
from datetime import datetime

class TrafficMonitorConfig:
    """Tool for creating and testing configurations"""
    
    def __init__(self):
        self.config_data = {
            'polygon_points': [],
            'traffic_light_regions': [],
            'video_settings': {
                'resize_width': 800,
                'resize_height': 480,
                'process_every_n_frames': 2,
                'detection_confidence': 0.5
            },
            'tracking_settings': {
                'max_disappeared': 10,
                'max_distance': 50
            }
        }
        
    def create_config_interactive(self, video_path):
        """Interactive configuration creator"""
        print("=== Interactive Configuration Creator ===")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Cannot open video: {video_path}")
            return None
        
        # Get first frame
        ret, frame = cap.read()
        if not ret:
            print("Cannot read first frame")
            cap.release()
            return None
        
        # Resize frame
        frame = cv2.resize(frame, (self.config_data['video_settings']['resize_width'], 
                                  self.config_data['video_settings']['resize_height']))
        
        self.setup_polygon(frame.copy())
        self.setup_traffic_lights(frame.copy())
        
        cap.release()
        
        # Save configuration
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        config_filename = f"config_{video_name}.json"
        
        with open(config_filename, 'w') as f:
            json.dump(self.config_data, f, indent=2)
        
        print(f"Configuration saved to: {config_filename}")
        return config_filename
    
    def setup_polygon(self, frame):
        """Setup violation detection polygon"""
        print("\n=== Setup Violation Area ===")
        print("Click to add polygon points, press 'f' to finish, 'r' to reset")
        
        polygon_points = []
        
        def mouse_callback(event, x, y, flags, param):
            nonlocal polygon_points
            if event == cv2.EVENT_LBUTTONDOWN:
                polygon_points.append((x, y))
                print(f"Point {len(polygon_points)}: ({x}, {y})")
        
        cv2.namedWindow('Setup Polygon')
        cv2.setMouseCallback('Setup Polygon', mouse_callback)
        
        while True:
            display_frame = frame.copy()
            
            # Draw current polygon points
            for i, point in enumerate(polygon_points):
                cv2.circle(display_frame, point, 5, (0, 255, 0), -1)
                cv2.putText(display_frame, str(i+1), (point[0]+10, point[1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Draw lines between points
            if len(polygon_points) > 1:
                pts = np.array(polygon_points, np.int32)
                cv2.polylines(display_frame, [pts], False, (0, 255, 0), 2)
            
            # Draw instructions
            cv2.putText(display_frame, 'Click to add points, F=finish, R=reset', 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(display_frame, f'Points: {len(polygon_points)}', 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            cv2.imshow('Setup Polygon', display_frame)
            
            key = cv2.waitKey(30) & 0xFF
            if key == ord('f') and len(polygon_points) >= 3:
                break
            elif key == ord('r'):
                polygon_points = []
                print("Reset polygon")
            elif key == ord('q'):
                break
        
        cv2.destroyWindow('Setup Polygon')
        
        if len(polygon_points) >= 3:
            self.config_data['polygon_points'] = polygon_points
            print(f"Polygon saved with {len(polygon_points)} points")
        else:
            print("Polygon not saved - need at least 3 points")
    
    def setup_traffic_lights(self, frame):
        """Setup traffic light detection regions"""
        print("\n=== Setup Traffic Light Regions ===")
        print("Drag to select traffic light areas, press 'f' to finish")
        
        traffic_light_regions = []
        selecting = False
        start_point = None
        
        def mouse_callback(event, x, y, flags, param):
            nonlocal selecting, start_point, traffic_light_regions
            
            if event == cv2.EVENT_LBUTTONDOWN:
                selecting = True
                start_point = (x, y)
            elif event == cv2.EVENT_LBUTTONUP and selecting:
                selecting = False
                if start_point:
                    x1, y1 = start_point
                    x2, y2 = x, y
                    # Ensure proper rectangle
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    if (x2 - x1) > 10 and (y2 - y1) > 10:  # Minimum size
                        traffic_light_regions.append((x1, y1, x2, y2))
                        print(f"Traffic light region {len(traffic_light_regions)}: ({x1}, {y1}, {x2}, {y2})")
        
        cv2.namedWindow('Setup Traffic Lights')
        cv2.setMouseCallback('Setup Traffic Lights', mouse_callback)
        
        while True:
            display_frame = frame.copy()
            
            # Draw existing regions
            for i, (x1, y1, x2, y2) in enumerate(traffic_light_regions):
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                cv2.putText(display_frame, f'TL{i+1}', (x1, y1-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # Draw current selection
            if selecting and start_point:
                mouse_pos = cv2.getMouseCallback('Setup Traffic Lights')
                # Note: In real implementation, you'd track current mouse position
            
            # Draw instructions
            cv2.putText(display_frame, 'Drag to select traffic light areas, F=finish', 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(display_frame, f'Regions: {len(traffic_light_regions)}', 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            cv2.imshow('Setup Traffic Lights', display_frame)
            
            key = cv2.waitKey(30) & 0xFF
            if key == ord('f'):
                break
            elif key == ord('r'):
                traffic_light_regions = []
                print("Reset traffic light regions")
            elif key == ord('q'):
                break
        
        cv2.destroyWindow('Setup Traffic Lights')
        
        self.config_data['traffic_light_regions'] = traffic_light_regions
        print(f"Traffic light regions saved: {len(traffic_light_regions)} regions")

    def test_configuration(self, video_path, config_file):
        """Test a configuration with a video"""
        print(f"=== Testing Configuration: {config_file} ===")
        
        # Load configuration
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            print(f"Configuration file not found: {config_file}")
            return
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Cannot open video: {video_path}")
            return
        
        print("Testing configuration - press 'q' to quit")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Loop video
                continue
            
            # Resize frame
            frame = cv2.resize(frame, (config['video_settings']['resize_width'], 
                                     config['video_settings']['resize_height']))
            
            # Draw polygon
            if config['polygon_points']:
                pts = np.array(config['polygon_points'], np.int32)
                cv2.polylines(frame, [pts], True, (0, 255, 0), 2)
                cv2.fillPoly(frame, [pts], (0, 255, 0, 30))
            
            # Draw traffic light regions
            for i, (x1, y1, x2, y2) in enumerate(config['traffic_light_regions']):
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                cv2.putText(frame, f'TL{i+1}', (x1, y1-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # Add info text
            cv2.putText(frame, 'Configuration Test - Press Q to quit', 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            cv2.imshow('Configuration Test', frame)
            
            if cv2.waitKey(30) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()

    def create_multiple_configs(self):
        """Create configurations for multiple videos"""
        print("=== Create Multiple Configurations ===")
        
        video_dir = input("Enter directory containing videos (or press Enter for default): ").strip()
        if not video_dir:
            video_dir = r"D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation"
        
        if not os.path.exists(video_dir):
            print(f"Directory not found: {video_dir}")
            return
        
        # Find video files
        video_extensions = ['.mp4', '.avi', '.mov', '.mkv']
        video_files = []
        
        for file in os.listdir(video_dir):
            if any(file.lower().endswith(ext) for ext in video_extensions):
                video_files.append(os.path.join(video_dir, file))
        
        if not video_files:
            print("No video files found")
            return
        
        print(f"Found {len(video_files)} video files:")
        for i, video in enumerate(video_files):
            print(f"{i+1}. {os.path.basename(video)}")
        
        for video_path in video_files:
            print(f"\n--- Configuring: {os.path.basename(video_path)} ---")
            
            response = input("Configure this video? (y/n/q): ").lower()
            if response == 'q':
                break
            elif response == 'y':
                self.create_config_interactive(video_path)


def main():
    print("=== Traffic Monitor Configuration Tool ===")
    print("1. Create new configuration")
    print("2. Test existing configuration") 
    print("3. Create multiple configurations")
    print("4. Quick test with default video")
    
    try:
        choice = input("Select option (1-4): ").strip()
        
        config_tool = TrafficMonitorConfig()
        
        if choice == '1':
            video_path = input("Enter video path: ").strip().strip('"')
            if os.path.exists(video_path):
                config_tool.create_config_interactive(video_path)
            else:
                print("Video file not found")
        
        elif choice == '2':
            video_path = input("Enter video path: ").strip().strip('"')
            config_file = input("Enter config file path: ").strip().strip('"')
            
            if os.path.exists(video_path) and os.path.exists(config_file):
                config_tool.test_configuration(video_path, config_file)
            else:
                print("Video or config file not found")
        
        elif choice == '3':
            config_tool.create_multiple_configs()
        
        elif choice == '4':
            # Quick test with default video
            default_video = r"D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\tr.mp4"
            if os.path.exists(default_video):
                config_file = config_tool.create_config_interactive(default_video)
                if config_file:
                    config_tool.test_configuration(default_video, config_file)
            else:
                print("Default video not found")
        
        else:
            print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\nCancelled by user")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
