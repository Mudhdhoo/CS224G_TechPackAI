import cv2
import numpy as np
from PIL import Image

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

def add_keypoints(image, kpts):
    # Convert to numpy array for plotting
    im = np.array(image.permute(1,2,0)).copy()
    kpts = np.array(kpts)
    for kp in kpts:
        x, y = int(kp[0]), int(kp[1])
        # Draw red circle
        if (x,y) != (0,0):
            cv2.circle(im, (x, y), 5, (0, 255, 0), -1)

    return im

def extract_number(filename):
    # Assumes format is consistent: "image_123.jpg"
    # Split by underscore, then take the part before .jpg
    try:
        return int(filename.split('_')[1].split('.')[0])
    except (IndexError, ValueError):
        return 0  # Default if format doesn't match
    
def normalize_image(image: Image.Image):
    """
    Normalizes a PIL image using the given mean and standard deviation.

    Args:
        image (PIL.Image.Image): The input image.

    Returns:
        np.ndarray: The normalized image as a NumPy array.
    """
    # Convert image to NumPy array (scale to [0,1])
    image_array = np.array(image).astype(np.float32) / 255.0

    # Define mean and standard deviation
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])

    # Normalize (broadcasting across channels)
    normalized_image = (image_array - mean) / std

    return normalized_image



