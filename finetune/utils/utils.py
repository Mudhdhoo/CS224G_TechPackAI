import cv2
import numpy as np
from PIL import Image
from loguru import logger
import matplotlib.pyplot as plt
import os
import torch

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

    if image_array.ndim < 3:
        image_array = np.stack([image_array, image_array, image_array],axis=-1)

    # Define mean and standard deviation
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])

    # Normalize (broadcasting across channels)
    normalized_image = (image_array - mean) / std

    return normalized_image


def save_learning_curve(epochs, train_losses, output_dir):
    """
    Save the learning curve plot.
    
    Args:
        epochs (list): List of epoch numbers
        train_losses (list): List of training losses for each epoch
        output_dir (str): Directory to save the plot
    """
    plt.figure(figsize=(10, 5))
    plt.plot(epochs, train_losses, label='Training Loss')
    plt.title('Learning Curve')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the plot
    plt.savefig(os.path.join(output_dir, 'learning_curve.png'))
    plt.close()

def save_checkpoint(model, optimizer, scheduler, epoch, train_losses, output_dir):
    """
    Save model checkpoint.
    
    Args:
        model (nn.Module): The model to save
        optimizer (torch.optim.Optimizer): The optimizer state
        scheduler (torch.optim.lr_scheduler): The learning rate scheduler state
        epoch (int): Current epoch number
        train_losses (list): List of training losses
        output_dir (str): Directory to save the checkpoint
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare checkpoint dictionary
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'scheduler_state_dict': scheduler.state_dict(),
        'train_losses': train_losses
    }
    
    # Save checkpoint
    checkpoint_path = os.path.join(output_dir, f'checkpoint_epoch_{epoch+1}.pth')
    torch.save(checkpoint, checkpoint_path)
    logger.info(f"Saved checkpoint to {checkpoint_path}")

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


