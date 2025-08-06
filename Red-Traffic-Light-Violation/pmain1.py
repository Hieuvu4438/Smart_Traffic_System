import cv2
from ultralytics import YOLO
import pandas as pd
import numpy as np
from test1 import process_frame
import os
from tracker import*
from datetime import datetime
import time

# Use smaller, faster model for better FPS
model = YOLO(r"D:\PROJECTS\Traffic Detection using YOLO\yolov10n.pt")  # nano model for speed  

def RGB(event, x, y, flags, param):
    if event == cv2.EVENT_MOUSEMOVE:
        point = [x, y]
        print(point)

cv2.namedWindow('RGB')
cv2.setMouseCallback('RGB', RGB)

cap = cv2.VideoCapture(r'D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\tr.mp4')
# cap = cv2.VideoCapture(r'D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\16h15.5.9.22.mp4')
my_file = open(r"D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\coco.txt", "r")
data = my_file.read()
class_list = data.split("\n")
tracker=Tracker()
count = 0
# Adjusted area coordinates for 800x480 resolution
area = [(254, 250), (222, 299), (670, 314), (678, 258)]

# Create directory for today's date
today_date = datetime.now().strftime('%Y-%m-%d')
output_dir = os.path.join('saved_images', today_date)
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
list1=[]

# FPS tracking
fps_counter = 0
start_time = time.time()
fps_display = 0

# Initialize detection variables
detected_label = None
current_detections = []
current_detection_data = []
while True:
    ret, frame = cap.read()
    count += 1
    # Process every frame for real-time playback, but optimize processing
    if not ret:
        break

    # FPS calculation
    fps_counter += 1
    if fps_counter % 5 == 0:  # Update FPS every 5 frames for more accurate reading
        end_time = time.time()
        fps_display = 5 / (end_time - start_time)
        start_time = end_time

    # Resize to smaller size for faster processing
    frame = cv2.resize(frame, (800, 480))  # Smaller resolution for better FPS
    
    # Only run detection every 3rd frame to save processing power
    # but display all frames for smooth video
    if count % 3 == 0:
        processed_frame, detected_label = process_frame(frame)
        results = model(frame)
        a = results[0].boxes.data
        
        # Store detection results for use in other frames
        current_detections = []
        current_detection_data = []
        if len(a) > 0:
            # Convert tensor from GPU to CPU then to numpy
            a_cpu = a.cpu().numpy() if hasattr(a, 'cpu') else a
            px = pd.DataFrame(a_cpu).astype("float")
            list=[]
            detection_data = []  # Store both bbox and class info
            for index, row in px.iterrows():
                x1 = int(row[0])
                y1 = int(row[1])
                x2 = int(row[2])
                y2 = int(row[3])
                
                d = int(row[5])
                c = class_list[d]
                list.append([x1,y1,x2,y2])
                detection_data.append(c)
                
            bbox_idx=tracker.update(list)
            current_detections = bbox_idx
            current_detection_data = detection_data
    
    # Check if there are any detections to display
    if len(current_detections) == 0:
        cv2.polylines(frame, [np.array(area, np.int32)], True, (0, 255, 0), 2)
        # Display FPS even when no detections
        cv2.putText(frame, f'FPS: {fps_display:.1f}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Light: {detected_label}', (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    else:
        # Store detections for next frames
        tracker.last_detections = current_detections
        tracker.last_detection_data = current_detection_data
        
        # Simplified mapping - just use index matching
        for i, bbox in enumerate(current_detections):
            if len(bbox) >= 5:
                x3,y3,x4,y4,id=bbox
                # Use simple index mapping if available, otherwise "unknown"
                c = current_detection_data[i] if i < len(current_detection_data) else "unknown"
        
            cx = int((x3 + x4) // 2)
            cy = int((y3 + y4) // 2)
            result = cv2.pointPolygonTest(np.array(area, np.int32), ((cx, cy)), False)
            if result>=0:
               if 'car' in c and detected_label == "RED":
                    cv2.putText(frame, f'{id}', (x3, y3-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.rectangle(frame, (x3, y3), (x4, y4), (0, 0, 255), 2)
                    
                    # Save the image with red label
                    timestamp = datetime.now().strftime('%H-%M-%S-%f')[:-3]  # Include milliseconds
                    image_filename = f"violation_{id}_{timestamp}.jpg"
                    output_path = os.path.join(output_dir, image_filename)
                    if list1.count(id)==0:
                       list1.append(id)
                       cv2.imwrite(output_path, frame)
               else:     
                    cv2.putText(frame, f'{id}', (x3, y3-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    cv2.rectangle(frame, (x3, y3), (x4, y4), (0, 255, 0), 2)

    cv2.polylines(frame, [np.array(area, np.int32)], True, (0, 255, 0), 2)
    
    # Display FPS
    cv2.putText(frame, f'FPS: {fps_display:.1f}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.putText(frame, f'Light: {detected_label}', (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    
    cv2.imshow("RGB", frame)
    
    # Add proper delay for real-time playback (30 FPS = ~33ms delay)
    if cv2.waitKey(33) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
