import cv2
from ultralytics import YOLO
from speed_new import SpeedEstimator

# Load YOLOv8 model
model = YOLO("yolov10n.pt")
# Initialize global variable to store cursor coordinates
line_pts = [(0, 288), (1019, 288)]
names = model.model.names  # This is a dictionary

# Create SpeedEstimator with improved calibrated parameters
speed_obj = SpeedEstimator(reg_pts=line_pts, names=names)

# Print calibration info
print("=== Advanced IPM Speed Estimation ===")
print(f"Real-world area: {speed_obj.real_world_width}m x {speed_obj.real_world_length}m")
print(f"Meters per pixel X: {speed_obj.meters_per_pixel_x:.4f}")
print(f"Meters per pixel Y: {speed_obj.meters_per_pixel_y:.4f}")
print("Controls:")
print("- 'q': Quit")
print("- 'c': Calibrate (adjust IPM points)")
print("- Mouse: Show coordinates for IPM adjustment")

# Mouse callback function to capture mouse movement
def RGB(event, x, y, flags, param):
    global cursor_point
    if event == cv2.EVENT_MOUSEMOVE:
        cursor_point = (x, y)
        print(f"Mouse coordinates: {cursor_point}")

# Set up the window and attach the mouse callback function
cv2.namedWindow('RGB')
cv2.setMouseCallback('RGB', RGB)

# Open the video file or webcam feed
# cap = cv2.VideoCapture(r'D:\PROJECTS\Traffic Detection using YOLO\Red-Traffic-Light-Violation\tr.mp4')
cap = cv2.VideoCapture(r'D:\PROJECTS\Traffic Detection using YOLO\Data\video\ACC Export-2022-10-18 10.22.06.211 AM.avi')
count = 0
while True:
    ret, frame = cap.read()

    if not ret:
        print("Video stream ended or cannot be read.")
        break

    # Remove frame skipping for real-time processing
    frame = cv2.resize(frame, (1020, 500))
    
    # Perform object tracking
    tracks = model.track(frame, persist=True,classes=[2,7])
    
    
    im0 = speed_obj.estimate_speed(frame,tracks)
    
    # Display the frame with speed estimation results
    cv2.imshow("RGB", im0)

    # Handle key presses
    key = cv2.waitKey(30) & 0xFF
    if key == ord("q"):
        break
    elif key == ord("c"):
        # Manual calibration mode - adjust IPM points
        print("\n=== IPM Calibration Mode ===")
        print("Current IPM source points (road boundaries in camera view):")
        for i, point in enumerate(speed_obj.src_points):
            print(f"Point {i+1}: ({int(point[0])}, {int(point[1])})")
        
        print("\nTo recalibrate:")
        print("1. Note the pixel coordinates of road boundaries")
        print("2. Update src_points in speed_new.py")
        print("3. Adjust real_world_width and real_world_length")
        print("4. Restart the program")
        
        if len(tracks[0].boxes) > 0:
            print(f"\nDetected {len(tracks[0].boxes)} vehicles for reference")
        break

cap.release()
cv2.destroyAllWindows()
