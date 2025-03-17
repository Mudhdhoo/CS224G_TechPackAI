import base64
import torch
from loguru import logger
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2
import re

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
    
def replace_between_markers(original, start_marker, end_marker, new_content):
    pattern = re.compile(
        rf'({re.escape(start_marker)})(.*?){re.escape(end_marker)}',
        re.DOTALL
    )
    return pattern.sub(lambda m: f"{m.group(1)}\n{new_content}\n{end_marker}", original)
    
def load_checkpoint(checkpoint_path, model, optimizer=None, scheduler=None):
    """
    Load model checkpoint.
    
    Args:
        checkpoint_path (str): Path to the checkpoint file
        model (nn.Module): The model to load state into
        optimizer (torch.optim.Optimizer, optional): Optimizer to load state into
        scheduler (torch.optim.lr_scheduler, optional): Scheduler to load state into
    
    Returns:
        tuple: (start_epoch, train_losses) for resuming training
    """
    # Load checkpoint
    checkpoint = torch.load(checkpoint_path, map_location=torch.device('cpu'), weights_only=False)
    
    # Load model state
    model.load_state_dict(checkpoint['model_state_dict'])
    logger.info(f"Loaded model state from {checkpoint_path}")
    
    # Load optimizer state if provided
    if optimizer is not None:
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        logger.info("Loaded optimizer state")
    
    # Load scheduler state if provided
    if scheduler is not None:
        scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        logger.info("Loaded scheduler state")
    
    # Return starting epoch and previous train losses
    return checkpoint['epoch'], checkpoint.get('train_losses', [])

def draw_keypoints(
    image, coordinates, radius=12, text_size=1, 
    dot_color=(0, 255, 0),  # Green in RGB format
    text_color=(0, 0, 255),  # White
    start_num=1
):
    """ Draw dots with numbers at specified coordinates on an image.
    
    Parameters:
    -----------
    image : numpy.ndarray
        The input image as a numpy array
    coordinates : list of tuples
        List of (x, y) coordinates where dots should be drawn
    radius : int, optional
        Radius of the dots to be drawn (default: 10)
    text_size : float, optional
        Size of the text (default: 0.5)
    dot_color : tuple, optional
        Color of the dots in RGB format (default: green (0, 255, 0))
    text_color : tuple, optional
        Color of the text in RGB format (default: white (255, 255, 255))
    start_num : int, optional
        Starting number for the dots (default: 1)
        
    Returns:
    --------
    numpy.ndarray
        The image with dots and numbers drawn on it
    """

    if image.dtype != np.uint8:
        image = image.astype(np.uint8)

    if image.shape[-1] == 4:
        image = image[:,:,:3]

    result_image = image.copy()
    
    # Get image dimensions
    height, width = result_image.shape[:2]
    
    # Draw dots and numbers at each coordinate
    for i, (x, y) in enumerate(coordinates):
        # Convert coordinates to integers if they aren't already
        x, y = int(x), int(y)
        
        # Ensure coordinates are within image bounds
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
        
        # Convert RGB to BGR for OpenCV functions
        bgr_dot_color = dot_color[::-1]  # Reverse the RGB tuple to get BGR
        bgr_text_color = text_color[::-1]  # Reverse the RGB tuple to get BGR
        
        # Draw the dot
        cv2.circle(result_image, (x, y), radius, bgr_dot_color, -1)  # -1 fills the circle
        
        # Calculate text to be drawn
        text = str(i + start_num)
        text_font = cv2.FONT_HERSHEY_SIMPLEX
        text_thickness = 2
        
        # Get text size to center it properly
        (text_width, text_height), baseline = cv2.getTextSize(text, text_font, text_size, text_thickness)
        
        # Calculate position to center text in the dot
        text_x = int(x - text_width / 2)
        text_y = int(y + text_height / 2)
        
        # Draw the number
        cv2.putText(result_image, text, (text_x, text_y), text_font, text_size, bgr_text_color, text_thickness)
    
    return result_image

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

    if image_array.ndim < 3:
        image_array = np.stack([image_array, image_array, image_array],axis=-1)
    
    if image_array.shape[-1] == 4:
        image_array = image_array[:,:,:3]

    # Define mean and standard deviation
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])

    # Normalize (broadcasting across channels)
    normalized_image = (image_array - mean) / std

    return normalized_image