import base64
import torch
from loguru import logger
import numpy as np
from PIL import Image, ImageDraw, ImageFont

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

def draw_keypoints(image_array, keypoints, color=(0, 255, 0), radius=8):
    """
    Draw keypoints with numbers on an image array using PIL
    
    Args:
        image_array: Numpy array of the image
        keypoints: List of (x, y) coordinates
        color: RGB color tuple for the keypoints
        radius: Radius of the keypoint circles
    
    Returns:
        Numpy array of the image with keypoints and numbers
    """
    if image_array.ndim < 3:
        image_array = np.stack([image_array, image_array, image_array], axis=-1)
    
    # Convert numpy array to PIL Image
    image = Image.fromarray(image_array)
    
    # Create a transparent version of the image for overlays
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    image = image.convert('RGBA')
    
    # Create a drawing object for the overlay
    draw = ImageDraw.Draw(overlay)
    
    # Set a default font
    try:
        font = ImageFont.truetype("arial.ttf", size=radius * 3)
    except IOError:
        font = ImageFont.load_default()
    
    # Create transparent fill color with the same RGB but 50% opacity
    fill_color = color #+ (128,)  # Add alpha channel (128 = 50% opacity)
    border_color = (0, 0, 0)     # Black border
    
    # Draw each keypoint as a circle with a number inside
    for idx, point in enumerate(keypoints, start=1):
        x, y = int(point[0]), int(point[1])
        
        # Draw a circle with transparent fill and solid border
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), 
                     fill=fill_color, outline=border_color)
        
        # Calculate text size and position using font.getbbox()
        text = str(idx)
        bbox = font.getbbox(text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = x - text_width // 2
        text_y = y - text_height // 2
        
        # Draw the number inside the keypoint
        draw.text((text_x, text_y), text, fill=(255, 0, 0), font=font)
    
    # Composite the overlay with the original image
    result = Image.alpha_composite(image, overlay)
    
    # Convert back to RGB for numpy compatibility if needed
    result = result.convert('RGB')
    
    # Convert back to numpy array
    return np.array(result)

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