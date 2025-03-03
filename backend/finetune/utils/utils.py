import cv2
import numpy as np

def add_keypoints(image, kpts):
    # Convert to numpy array for plotting
    kpts = np.array(kpts).reshape([-1,3])

    for kp in kpts:
        vis, x, y = int(kp[0]), int(kp[1]), int(kp[2])
        if vis == 0 or vis == 1:
            # Draw red circle
            cv2.circle(image, (x, y), 8, (255, 0, 0), -1)

    return image

def extract_number(filename):
    # Assumes format is consistent: "image_123.jpg"
    # Split by underscore, then take the part before .jpg
    try:
        return int(filename.split('_')[1].split('.')[0])
    except (IndexError, ValueError):
        return 0  # Default if format doesn't match



