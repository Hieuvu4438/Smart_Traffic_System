from ultralytics import YOLO
import cv2
import numpy as np
import torch
import time
import os

class HelmetDetector:
    def __init__(self):
        self.model_path = r"D:\PROJECTS\Traffic Detection using YOLO\runs\train_helmet\exp_helmet\weights\best.pt"
        self.model = None
        self.class_names = None
        self.fps_counter = 0
        self.fps_start_time = time.time()
        self.current_fps = 0
        self.total_detections = 0
        self.helmet_count = 0
        self.no_helmet_count = 0
        
        self.load_model()
    
    def load_model(self):
        print("=== HELMET DETECTION SYSTEM ===")
        print("Loading model...")
        if torch.cuda.is_available():
            print(f"✓ GPU available: {torch.cuda.get_device_name()}")
            self.device = 0
        else:
            print("⚠ Using CPU")
            self.device = 'cpu'
        try:
            if not os.path.exists(self.model_path):
                print(f"✗ Model not found: {self.model_path}")
                return False
                
            self.model = YOLO(self.model_path)
            self.class_names = self.model.names
            print(f"✓ Model loaded successfully")
            print(f"✓ Classes: {self.class_names}")
            return True
            
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            return False
    
    def detect_helmets(self, image, conf_threshold=0.5):
        if self.model is None:
            return [], []
        results = self.model.predict(source=image, device=self.device, 
                                   save=False, verbose=False, 
                                   conf=conf_threshold, iou=0.5)
        
        detections = []
        helmet_status = []
        
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
                    class_id = int(box.cls[0].item())
                    confidence = box.conf[0].item()
                    
                    if class_id < len(self.class_names):
                        class_name = self.class_names[class_id]
                        
                        detection = {
                            'bbox': [int(x_min), int(y_min), int(x_max), int(y_max)],
                            'class': class_name,
                            'class_id': class_id,
                            'confidence': confidence
                        }
                        
                        detections.append(detection)
                        
                        # Determine helmet status
                        if 'helmet' in class_name.lower():
                            helmet_status.append('helmet')
                            self.helmet_count += 1
                        elif 'no' in class_name.lower() or 'without' in class_name.lower():
                            helmet_status.append('no_helmet')
                            self.no_helmet_count += 1
                        else:
                            helmet_status.append('unknown')
                        
                        self.total_detections += 1
        
        return detections, helmet_status
    
    def draw_detections(self, image, detections, helmet_status):
        annotated_image = image.copy()
        height, width = image.shape[:2]
        
        for i, detection in enumerate(detections):
            bbox = detection['bbox']
            class_name = detection['class']
            confidence = detection['confidence']
            
            x_min, y_min, x_max, y_max = bbox
            status = helmet_status[i] if i < len(helmet_status) else 'unknown'
            
            if status == 'helmet':
                color = (0, 255, 0)  
                status_text = "WITH HELMET"
            elif status == 'no_helmet':
                color = (0, 0, 255) 
                status_text = "NO HELMET"
            else:
                color = (255, 255, 0) 
                status_text = "UNKNOWN"
            cv2.rectangle(annotated_image, (x_min, y_min), (x_max, y_max), color, 2)

            label = f"{class_name}: {confidence:.2f}"
            status_label = f"{status_text}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)[0]
            status_size = cv2.getTextSize(status_label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]

            cv2.rectangle(annotated_image, (x_min, y_min - 60), 
                         (x_min + max(label_size[0], status_size[0]) + 10, y_min), color, -1)

            cv2.putText(annotated_image, label, (x_min + 5, y_min - 35),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(annotated_image, status_label, (x_min + 5, y_min - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        self.draw_statistics(annotated_image)
        
        return annotated_image
    
    def draw_statistics(self, image):
        height, width = image.shape[:2]

        cv2.rectangle(image, (10, 10), (300, 120), (0, 0, 0), -1)
        cv2.rectangle(image, (10, 10), (300, 120), (255, 255, 255), 2)

        stats = [
            f"FPS: {self.current_fps:.1f}",
            f"Total Detections: {self.total_detections}",
            f"With Helmet: {self.helmet_count}",
            f"No Helmet: {self.no_helmet_count}"
        ]
        
        for i, stat in enumerate(stats):
            cv2.putText(image, stat, (15, 35 + i * 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

        if self.total_detections > 0:
            compliance_rate = (self.helmet_count / self.total_detections) * 100
            cv2.putText(image, f"Compliance: {compliance_rate:.1f}%", 
                       (15, 35 + len(stats) * 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)

        cv2.putText(image, f"Resolution: {width}x{height}", 
                   (width - 200, height - 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(image, "Press Q-Quit | S-Save Stats | R-Reset", 
                   (10, height - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def update_fps(self):
        self.fps_counter += 1
        if time.time() - self.fps_start_time >= 1.0:
            self.current_fps = self.fps_counter / (time.time() - self.fps_start_time)
            self.fps_counter = 0
            self.fps_start_time = time.time()
    
    def reset_stats(self):
        self.total_detections = 0
        self.helmet_count = 0
        self.no_helmet_count = 0
        print("✓ Statistics reset")
    
    def save_stats(self, filename=None):
        if filename is None:
            filename = f"helmet_stats_{int(time.time())}.txt"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("=== HELMET DETECTION STATISTICS ===\n")
                f.write(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Total Detections: {self.total_detections}\n")
                f.write(f"With Helmet: {self.helmet_count}\n")
                f.write(f"No Helmet: {self.no_helmet_count}\n")
                if self.total_detections > 0:
                    compliance = (self.helmet_count / self.total_detections) * 100
                    f.write(f"Compliance Rate: {compliance:.2f}%\n")
                f.write(f"Model: {self.model_path}\n")
            
            print(f"✓ Statistics saved to {filename}")
            return True
        except Exception as e:
            print(f"✗ Error saving stats: {e}")
            return False
    
    def process_image(self, image_path, show_result=True, save_result=False):
        print(f"Processing image: {image_path}")
        
        if not os.path.exists(image_path):
            print(f"✗ Image not found: {image_path}")
            return None
        image = cv2.imread(image_path)
        if image is None:
            print(f"✗ Cannot read image: {image_path}")
            return None
        
        print(f"✓ Image loaded: {image.shape}")

        detections, helmet_status = self.detect_helmets(image, conf_threshold=0.4)

        result_image = self.draw_detections(image, detections, helmet_status)
        
        print(f"✓ Found {len(detections)} detections")
        for i, detection in enumerate(detections):
            status = helmet_status[i] if i < len(helmet_status) else 'unknown'
            print(f"  - {detection['class']}: {detection['confidence']:.3f} ({status})")
        
        if show_result:
            height, width = result_image.shape[:2]
            if width > 1280:
                scale = 1280 / width
                new_width = int(width * scale)
                new_height = int(height * scale)
                result_image = cv2.resize(result_image, (new_width, new_height))
            
            cv2.imshow('Helmet Detection - Image', result_image)
            print("Press any key to continue...")
            cv2.waitKey(0)
            cv2.destroyAllWindows()
        
        if save_result:
            output_path = image_path.replace('.', '_result.')
            cv2.imwrite(output_path, result_image)
            print(f"✓ Result saved to: {output_path}")
        
        return result_image
    
    def process_video(self, video_source=0, target_fps=15):
        """Process video (file or webcam)"""
        print(f"Processing video: {video_source}")
        
        # Open video
        cap = cv2.VideoCapture(video_source)
        if not cap.isOpened():
            print(f"✗ Cannot open video: {video_source}")
            return
        
        # Get video info
        if video_source != 0:  # Not webcam
            original_fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / original_fps if original_fps > 0 else 0
            print(f"✓ Video info: {original_fps:.1f} FPS, {frame_count} frames, {duration:.1f}s")
        else:
            print("✓ Using webcam")
        
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"✓ Resolution: {width}x{height}")
        
        # FPS control
        frame_delay = 1.0 / target_fps
        print(f"✓ Target FPS: {target_fps}")
        
        # Setup window
        cv2.namedWindow('Helmet Detection - Video', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Helmet Detection - Video', min(1280, width), min(720, height))
        
        print("\n=== PROCESSING STARTED ===")
        print("Controls:")
        print("  Q/ESC - Quit")
        print("  S - Save statistics")
        print("  R - Reset statistics")
        print("  SPACE - Pause/Resume")
        
        frame_id = 0
        paused = False
        
        try:
            while True:
                if not paused:
                    loop_start = time.time()
                    
                    # Read frame
                    ret, frame = cap.read()
                    if not ret:
                        print("End of video or read error")
                        break
                    
                    frame_id += 1
                    
                    # Detect helmets
                    detections, helmet_status = self.detect_helmets(frame, conf_threshold=0.3)
                    
                    # Draw results
                    result_frame = self.draw_detections(frame, detections, helmet_status)
                    
                    # Update FPS
                    self.update_fps()
                    
                    # Show frame
                    cv2.imshow('Helmet Detection - Video', result_frame)
                    
                    # FPS control
                    elapsed = time.time() - loop_start
                    sleep_time = frame_delay - elapsed
                    if sleep_time > 0:
                        time.sleep(sleep_time)
                        wait_time = 1
                    else:
                        wait_time = 1
                    
                    # Progress info
                    if frame_id % 60 == 0:  # Every 60 frames
                        print(f"Frame {frame_id}: {len(detections)} detections, "
                              f"FPS: {self.current_fps:.1f}")
                
                else:
                    wait_time = 30  # Longer wait when paused
                
                # Handle keys
                key = cv2.waitKey(wait_time) & 0xFF
                if key == ord('q') or key == 27:  # Q or ESC
                    print("User quit")
                    break
                elif key == ord('s'):
                    self.save_stats()
                elif key == ord('r'):
                    self.reset_stats()
                elif key == ord(' '):  # SPACE
                    paused = not paused
                    print(f"{'Paused' if paused else 'Resumed'}")
        
        except KeyboardInterrupt:
            print("\nInterrupted by user")
        except Exception as e:
            print(f"Error during processing: {e}")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            
            # Final statistics
            print(f"\n=== PROCESSING COMPLETED ===")
            print(f"Total frames processed: {frame_id}")
            print(f"Total detections: {self.total_detections}")
            print(f"With helmet: {self.helmet_count}")
            print(f"No helmet: {self.no_helmet_count}")
            if self.total_detections > 0:
                compliance = (self.helmet_count / self.total_detections) * 100
                print(f"Helmet compliance rate: {compliance:.2f}%")

def main():
    """Main function"""
    detector = HelmetDetector()
    
    if detector.model is None:
        print("Failed to load model. Exiting...")
        return
    
    print("\n=== HELMET DETECTION SYSTEM ===")
    print("Choose mode:")
    print("1. Process image")
    print("2. Process video file")
    print("3. Live webcam detection")
    
    try:
        choice = input("Enter choice (1-3): ").strip()
        
        if choice == '1':
            # Image processing
            image_path = input("Enter image path: ").strip()
            save_result = input("Save result? (y/n): ").strip().lower() == 'y'
            detector.process_image(image_path, show_result=True, save_result=save_result)
            
        elif choice == '2':
            # Video file processing
            video_path = input("Enter video path: ").strip()
            fps = input("Target FPS (default 15): ").strip()
            fps = int(fps) if fps.isdigit() else 15
            detector.process_video(video_path, target_fps=fps)
            
        elif choice == '3':
            # Webcam detection
            fps = input("Target FPS (default 15): ").strip()
            fps = int(fps) if fps.isdigit() else 15
            detector.process_video(0, target_fps=fps)
            
        else:
            print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()