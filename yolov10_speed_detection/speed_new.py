from collections import defaultdict
from time import time

import cv2
import numpy as np

from ultralytics.utils.checks import check_imshow
from ultralytics.utils.plotting import Annotator, colors


class SpeedEstimator:
    """A class to estimate the speed of objects using Inverse Perspective Mapping for maximum accuracy."""

    def __init__(self, names, reg_pts=None, view_img=False, line_thickness=2, spdl_dist_thresh=10):
        """
        Initializes the SpeedEstimator with IPM for accurate speed calculation.
        """
        # Region information
        self.reg_pts = reg_pts if reg_pts is not None else [(20, 400), (1260, 400)]
        self.names = names  # Classes names

        # Tracking information
        self.trk_history = defaultdict(list)
        self.track_times = defaultdict(list)
        self.speed_history = defaultdict(list)

        self.view_img = view_img
        self.tf = line_thickness
        self.spd = {}

        # Inverse Perspective Mapping (IPM) setup
        self.frame_width = 1020
        self.frame_height = 500
        
        # Define perspective transformation points (ADJUST THESE FOR YOUR CAMERA)
        # Source points: trapezoid in camera view (road boundaries)
        self.src_points = np.float32([
            [150, 400],    # Bottom left road edge
            [870, 400],    # Bottom right road edge  
            [420, 280],    # Top left road edge (vanishing point area)
            [600, 280]     # Top right road edge (vanishing point area)
        ])
        
        # Destination points: rectangle in bird's eye view
        self.dst_points = np.float32([
            [200, 400],    # Bottom left
            [820, 400],    # Bottom right
            [200, 100],    # Top left  
            [820, 100]     # Top right
        ])
        
        # Calculate transformation matrices
        self.perspective_matrix = cv2.getPerspectiveTransform(self.src_points, self.dst_points)
        self.inverse_perspective_matrix = cv2.getPerspectiveTransform(self.dst_points, self.src_points)
        
        # Real-world calibration (ADJUST THESE FOR YOUR ROAD)
        self.real_world_width = 20.0  # Real width of road section in meters
        self.real_world_length = 40.0  # Real length of road section in meters
        self.bird_eye_width = 620  # Width in bird's eye view pixels
        self.bird_eye_length = 300  # Length in bird's eye view pixels
        
        # Calculate meters per pixel in bird's eye view
        self.meters_per_pixel_x = self.real_world_width / self.bird_eye_width
        self.meters_per_pixel_y = self.real_world_length / self.bird_eye_length
        
        # Speed calculation parameters
        self.min_track_length = 8
        self.min_movement_threshold = 1.0  # meters

        # Check if the environment supports imshow
        self.env_check = check_imshow(warn=True)

    def transform_to_bird_eye(self, point):
        """Transform a point from camera perspective to bird's eye view."""
        try:
            point_array = np.array([[[point[0], point[1]]]], dtype=np.float32)
            transformed = cv2.perspectiveTransform(point_array, self.perspective_matrix)
            return (float(transformed[0][0][0]), float(transformed[0][0][1]))
        except:
            return point  # Return original point if transformation fails
    
    def calculate_real_distance_ipm(self, point1, point2):
        """
        Calculate real-world distance using Inverse Perspective Mapping.
        This provides accurate distance regardless of position in frame.
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
        Calculate speed using multiple time intervals for maximum accuracy.
        """
        if len(track_points) < 5 or len(time_intervals) < 4:
            return 0
        
        speeds = []
        weights = []
        
        # Use different time windows for stability
        time_windows = [0.3, 0.6, 1.0, 1.5]  # seconds
        
        for window in time_windows:
            current_time = time_intervals[-1]
            target_time = current_time - window
            
            # Find the point closest to target_time
            best_idx = 0
            min_diff = float('inf')
            
            for i, t in enumerate(time_intervals):
                diff = abs(t - target_time)
                if diff < min_diff:
                    min_diff = diff
                    best_idx = i
            
            # Only use if time difference is reasonable
            if min_diff < window * 0.4:
                distance = self.calculate_real_distance_ipm(
                    track_points[best_idx], track_points[-1]
                )
                time_diff = time_intervals[-1] - time_intervals[best_idx]
                
                if time_diff > 0.1 and distance > self.min_movement_threshold:
                    speed = distance / time_diff * 3.6  # Convert to km/h
                    if 0 < speed < 300:  # Reasonable speed range
                        speeds.append(speed)
                        weights.append(window)  # Longer windows get more weight
        
        if not speeds:
            return 0
        
        # Calculate weighted average
        total_weight = sum(weights)
        if total_weight > 0:
            weighted_speed = sum(s * w for s, w in zip(speeds, weights)) / total_weight
            return weighted_speed
        
        return 0

    def smooth_speed(self, t_id, new_speed):
        """Apply smoothing to reduce speed jitter."""
        self.speed_history[t_id].append(new_speed)
        
        # Keep only recent values
        if len(self.speed_history[t_id]) > 7:
            self.speed_history[t_id].pop(0)
        
        # Apply weighted moving average
        if len(self.speed_history[t_id]) >= 3:
            weights = np.array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7])
            weights = weights[-len(self.speed_history[t_id]):]
            weights = weights / weights.sum()  # Normalize
            
            smoothed = sum(w * s for w, s in zip(weights, self.speed_history[t_id]))
            return smoothed
        
        return new_speed

    def estimate_speed(self, im0, tracks):
        """
        Estimates speed using IPM for maximum accuracy across all frame positions.
        """
        if tracks[0].boxes.id is None:
            return im0
       
        boxes = tracks[0].boxes.xyxy.cpu()
        clss = tracks[0].boxes.cls.cpu().tolist()
        t_ids = tracks[0].boxes.id.int().cpu().tolist()
        annotator = Annotator(im0, line_width=self.tf)
        
        # Draw perspective transformation area for visualization
        cv2.polylines(im0, [self.src_points.astype(int)], True, (0, 255, 255), 2)
        cv2.putText(im0, "IPM Area", (int(self.src_points[0][0]), int(self.src_points[0][1]) - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        
        # Draw speed line
        cv2.line(im0, self.reg_pts[0], self.reg_pts[1], (255, 0, 255), self.tf * 2)
        
        # Add calibration info
        cv2.putText(im0, f"IPM: {self.real_world_width}m x {self.real_world_length}m", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        current_time = time()

        for box, t_id, cls in zip(boxes, t_ids, clss):
            track = self.trk_history[t_id]
            bbox_center = (float((box[0] + box[2]) / 2), float((box[1] + box[3]) / 2))
            track.append(bbox_center)
            self.track_times[t_id].append(current_time)

            # Keep reasonable track history
            max_history = 50
            if len(track) > max_history:
                track.pop(0)
                self.track_times[t_id].pop(0)

            trk_pts = np.array(track).astype(np.int32).reshape((-1, 1, 2))

            # Initialize speed for new objects
            if t_id not in self.spd:
                self.spd[t_id] = 0

            # Calculate speed using IPM
            if len(track) >= self.min_track_length:
                calculated_speed = self.adaptive_speed_calculation(
                    track, self.track_times[t_id]
                )
                
                if calculated_speed > 0:
                    # Apply smoothing
                    smoothed_speed = self.smooth_speed(t_id, calculated_speed)
                    self.spd[t_id] = max(0, min(200, smoothed_speed))

            # Display results
            speed_value = int(self.spd.get(t_id, 0))
            track_quality = len(track)
            
            # Confidence indicator based on track quality
            if track_quality >= 20:
                confidence = "●●●"
            elif track_quality >= 10:
                confidence = "●●○"
            else:
                confidence = "●○○"
            
            speed_label = f"{self.names[int(cls)]}: {speed_value} km/h {confidence}"
            bbox_color = colors(int(t_id), True)

            annotator.box_label(box, speed_label, bbox_color)
            cv2.polylines(im0, [trk_pts], isClosed=False, color=bbox_color, thickness=self.tf)
            cv2.circle(im0, (int(track[-1][0]), int(track[-1][1])), self.tf * 2, bbox_color, -1)

        return im0


if __name__ == "__main__":
    names = {0: "person", 1: "car"}  # example class names
    speed_estimator = SpeedEstimator(names)
