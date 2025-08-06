

from collections import defaultdict
from time import time

import cv2
import numpy as np

from ultralytics.utils.checks import check_imshow
from ultralytics.utils.plotting import Annotator, colors


class SpeedEstimator:
    """A class to estimate the speed of objects in a real-time video stream based on their tracks."""

    def __init__(self, names, reg_pts=None, view_img=False, line_thickness=2, spdl_dist_thresh=10):
        """
        Initializes the SpeedEstimator with the given parameters.

        Args:
            names (dict): Dictionary of class names.
            reg_pts (list, optional): List of region points for speed estimation. Defaults to [(20, 400), (1260, 400)].
            view_img (bool, optional): Whether to display the image with annotations. Defaults to False.
            line_thickness (int, optional): Thickness of the lines for drawing boxes and tracks. Defaults to 2.
            spdl_dist_thresh (int, optional): Distance threshold for speed calculation. Defaults to 10.
        """
        # Region information
        self.reg_pts = reg_pts if reg_pts is not None else [(20, 400), (1260, 400)]

        self.names = names  # Classes names

        # Tracking information
        self.trk_history = defaultdict(list)

        self.view_img = view_img  # bool for displaying inference
        self.tf = line_thickness  # line thickness for annotator
        self.spd = {}  # set for speed data
        self.trkd_ids = []  # list for already speed_estimated and tracked ID's
        self.spdl = spdl_dist_thresh  # Speed line distance threshold
        self.trk_pt = {}  # set for tracks previous time
        self.trk_pp = {}  # set for tracks previous point
        
        # Inverse Perspective Mapping (IPM) parameters
        self.frame_width = 1020
        self.frame_height = 500
        
        # Define perspective transformation points
        # Source points (trapezoid in camera view)
        self.src_points = np.float32([
            [200, 350],    # Bottom left
            [820, 350],    # Bottom right
            [400, 250],    # Top left
            [620, 250]     # Top right
        ])
        
        # Destination points (rectangle in bird's eye view)
        self.dst_points = np.float32([
            [200, 400],    # Bottom left
            [820, 400],    # Bottom right
            [200, 100],    # Top left
            [820, 100]     # Top right
        ])
        
        # Calculate transformation matrices
        self.perspective_matrix = cv2.getPerspectiveTransform(self.src_points, self.dst_points)
        self.inverse_perspective_matrix = cv2.getPerspectiveTransform(self.dst_points, self.src_points)
        
        # Real-world scale calibration (meters per pixel in bird's eye view)
        self.real_world_width = 25.0  # Real width of road section in meters
        self.real_world_length = 50.0  # Real length of road section in meters
        self.bird_eye_width = 620  # Width in bird's eye view pixels
        self.bird_eye_length = 300  # Length in bird's eye view pixels
        
        self.meters_per_pixel_x = self.real_world_width / self.bird_eye_width
        self.meters_per_pixel_y = self.real_world_length / self.bird_eye_length
        
        # Speed calculation parameters
        self.min_track_length = 10
        self.speed_update_interval = 0.2
        self.min_movement_threshold = 2

        # Check if the environment supports imshow
        self.env_check = check_imshow(warn=True)

    def transform_to_bird_eye(self, point):
        """
        Transform a point from camera perspective to bird's eye view.
        """
        point_array = np.array([[[point[0], point[1]]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(point_array, self.perspective_matrix)
        return (transformed[0][0][0], transformed[0][0][1])
    
    def calculate_real_distance_ipm(self, point1, point2):
        """
        Calculate real-world distance using Inverse Perspective Mapping.
        This method provides accurate distance regardless of position in frame.
        """
        # Transform both points to bird's eye view
        bird_point1 = self.transform_to_bird_eye(point1)
        bird_point2 = self.transform_to_bird_eye(point2)
        
        # Calculate distance in bird's eye view pixels
        dx_pixels = bird_point2[0] - bird_point1[0]
        dy_pixels = bird_point2[1] - bird_point1[1]
        
        # Convert to real-world distance
        dx_meters = dx_pixels * self.meters_per_pixel_x
        dy_meters = dy_pixels * self.meters_per_pixel_y
        
        # Calculate Euclidean distance
        real_distance = np.sqrt(dx_meters**2 + dy_meters**2)
        
        return real_distance
    
    def adaptive_speed_calculation(self, track_points, time_intervals):
        """
        Calculate speed using multiple time intervals for better accuracy.
        Uses weighted average of different time windows.
        """
        if len(track_points) < 5 or len(time_intervals) < 4:
            return 0
        
        speeds = []
        weights = []
        
        # Calculate speeds for different time windows
        time_windows = [0.2, 0.5, 1.0, 2.0]  # seconds
        
        for window in time_windows:
            # Find points that are 'window' seconds apart
            current_time = time_intervals[-1]
            target_time = current_time - window
            
            # Find the closest point to target_time
            best_idx = 0
            min_diff = float('inf')
            
            for i, t in enumerate(time_intervals):
                diff = abs(t - target_time)
                if diff < min_diff:
                    min_diff = diff
                    best_idx = i
            
            if min_diff < window * 0.3:  # Only use if time difference is reasonable
                distance = self.calculate_real_distance_ipm(
                    track_points[best_idx], track_points[-1]
                )
                time_diff = time_intervals[-1] - time_intervals[best_idx]
                
                if time_diff > 0:
                    speed = distance / time_diff * 3.6  # Convert to km/h
                    speeds.append(speed)
                    # Weight longer time windows more heavily for stability
                    weights.append(window)
        
        if not speeds:
            return 0
        
        # Calculate weighted average
        total_weight = sum(weights)
        if total_weight > 0:
            weighted_speed = sum(s * w for s, w in zip(speeds, weights)) / total_weight
            return weighted_speed
        
        return 0
        """
        Calculate real-world distance between two points using perspective correction.
        """
        # Calculate pixel distance
        pixel_dist = np.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)
        
        # Apply perspective correction based on Y position (depth)
        # Objects further from camera (higher Y) appear smaller
        avg_y = (point1[1] + point2[1]) / 2
        frame_height = 500  # Current frame height
        
        # Perspective scaling factor (objects at bottom are closer, at top are further)
        perspective_factor = 1 + (avg_y / frame_height) * 0.5
        
        # Convert to real distance with perspective correction
        real_distance = pixel_dist * self.meters_per_pixel * perspective_factor
        
        return real_distance

    def smooth_speed(self, t_id, new_speed):
        """
        Apply smoothing to speed values to reduce jitter.
        """
        if not hasattr(self, 'speed_history'):
            self.speed_history = defaultdict(list)
        
        # Keep last 5 speed values for smoothing
        self.speed_history[t_id].append(new_speed)
        if len(self.speed_history[t_id]) > 5:
            self.speed_history[t_id].pop(0)
        
        # Return weighted average (more weight to recent values)
        weights = [0.1, 0.15, 0.2, 0.25, 0.3]  # Latest value has highest weight
        if len(self.speed_history[t_id]) == 5:
            smoothed_speed = sum(w * s for w, s in zip(weights, self.speed_history[t_id]))
        else:
            smoothed_speed = sum(self.speed_history[t_id]) / len(self.speed_history[t_id])
        
        return smoothed_speed
        """
        Estimates the speed of objects based on tracking data.

        Args:
            im0 (ndarray): The input image.
            tracks (list): List of tracks from YOLO tracking.

        Returns:
            ndarray: The annotated image.
        """
        if tracks[0].boxes.id is None:
            return im0
       
        boxes = tracks[0].boxes.xyxy.cpu()
        clss = tracks[0].boxes.cls.cpu().tolist()
        t_ids = tracks[0].boxes.id.int().cpu().tolist()
        annotator = Annotator(im0, line_width=self.tf)
        
        # Draw speed line using cv2.line instead of annotator.draw_region
        cv2.line(im0, self.reg_pts[0], self.reg_pts[1], (255, 0, 255), self.tf * 2)

    def estimate_speed(self, im0, tracks):
        """
        Estimates the speed of objects based on tracking data with improved accuracy.

        Args:
            im0 (ndarray): The input image.
            tracks (list): List of tracks from YOLO tracking.

        Returns:
            ndarray: The annotated image.
        """
        if tracks[0].boxes.id is None:
            return im0
       
        boxes = tracks[0].boxes.xyxy.cpu()
        clss = tracks[0].boxes.cls.cpu().tolist()
        t_ids = tracks[0].boxes.id.int().cpu().tolist()
        annotator = Annotator(im0, line_width=self.tf)
        
        # Draw speed line using cv2.line instead of annotator.draw_region
        cv2.line(im0, self.reg_pts[0], self.reg_pts[1], (255, 0, 255), self.tf * 2)
        
        # Add distance reference line
        cv2.putText(im0, f"Reference: {self.real_world_distance}m", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        for box, t_id, cls in zip(boxes, t_ids, clss):
            track = self.trk_history[t_id]
            bbox_center = (float((box[0] + box[2]) / 2), float((box[1] + box[3]) / 2))
            track.append(bbox_center)

            if len(track) > 50:  # Increased track history for better accuracy
                track.pop(0)

            trk_pts = np.array(track).astype(np.int32).reshape((-1, 1, 2))

            # Initialize tracking time if new object
            if t_id not in self.trk_pt:
                self.trk_pt[t_id] = time()
                self.trk_pp[t_id] = bbox_center
                self.spd[t_id] = 0

            # Calculate speed with improved accuracy
            if len(track) >= self.min_track_length:
                current_time = time()
                time_diff = current_time - self.trk_pt[t_id]
                
                if time_diff >= self.speed_update_interval:
                    # Calculate distance using multiple points for better accuracy
                    if t_id in self.trk_pp:
                        # Use real distance calculation with perspective correction
                        real_distance = self.calculate_real_distance(self.trk_pp[t_id], bbox_center)
                        
                        # Only update if significant movement detected
                        if real_distance > self.min_movement_threshold * self.meters_per_pixel:
                            # Calculate speed in m/s then convert to km/h
                            speed_ms = real_distance / time_diff
                            raw_speed = speed_ms * 3.6  # Convert to km/h
                            
                            # Apply smoothing to reduce jitter
                            smoothed_speed = self.smooth_speed(t_id, raw_speed)
                            
                            # Clamp speed to reasonable range (0-200 km/h)
                            self.spd[t_id] = max(0, min(200, smoothed_speed))
                            
                            # Update tracking data
                            self.trk_pt[t_id] = current_time
                            self.trk_pp[t_id] = bbox_center

            # Display speed label with confidence indicator
            speed_value = int(self.spd.get(t_id, 0))
            confidence = "✓" if len(track) >= self.min_track_length else "..."
            speed_label = f"{self.names[int(cls)]}: {speed_value} km/h {confidence}"
            bbox_color = colors(int(t_id), True)

            annotator.box_label(box, speed_label, bbox_color)
            cv2.polylines(im0, [trk_pts], isClosed=False, color=bbox_color, thickness=self.tf)
            cv2.circle(im0, (int(track[-1][0]), int(track[-1][1])), self.tf * 2, bbox_color, -1)

        return im0

        return im0

if __name__ == "__main__":
    names = {0: "person", 1: "car"}  # example class names
    speed_estimator = SpeedEstimator(names)