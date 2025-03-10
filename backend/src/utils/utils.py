import base64
import torch
from loguru import logger
import numpy as np
from PIL import Image, ImageDraw

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
    
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

def draw_keypoints(image_array, keypoints, color=(0, 255, 0), radius=5):
    """
    Draw keypoints on an image array using PIL
    
    Args:
        image_array: Numpy array of the image
        keypoints: List of (x, y) coordinates
        color: RGB color tuple for the keypoints
        radius: Radius of the keypoint circles
    
    Returns:
        Numpy array of the image with keypoints
    """
    if image_array.ndim < 3:
        image_array = np.stack([image_array, image_array, image_array],axis=-1)
    # Convert numpy array to PIL Image
    image = Image.fromarray(image_array)
    
    # Create a drawing object
    draw = ImageDraw.Draw(image)
    
    # Draw each keypoint as a circle
    for point in keypoints:
        x, y = int(point[0]), int(point[1])
        draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color, outline=color)
    
    # Convert back to numpy array
    return np.array(image)

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

    # Define mean and standard deviation
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])

    # Normalize (broadcasting across channels)
    normalized_image = (image_array - mean) / std

    return normalized_image