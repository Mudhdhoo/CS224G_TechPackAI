import torch
import numpy as np

kp2ind_full_body = {
    'left_collar':0,
    'right_collar':1,
    'left_sleeve':2,
    'right_sleeve':3,
    'left_waistline':4,
    'right_waitstline':5,
    'left_hem':6,
    'right_hem':7
}

kp2ind_upper_body = {
    'left_collar':0,
    'right_collar':1,
    'left_sleeve':2,
    'right_sleeve':3,
    'left_hem':4,
    'right_hem':5
}

kp2ind_lower_body = {
    'left_waistline':0,
    'right_waitstline':1,
    'left_hem':2,
    'right_hem':3
}

kp2ind = {
    "upper_body":kp2ind_upper_body,
    "lower_body":kp2ind_lower_body,
    "full_body":kp2ind_full_body
}

def extract_keypoints_from_heatmap(heatmap):
    """
    Extracts keypoint coordinates from predicted heatmaps.

    Args:
        heatmap: Tensor of shape (N_k, H, W)

    Returns:
        keypoints: List of (x, y) keypoints
    """
    N_k, H, W = heatmap.shape
    keypoints = []

    for i in range(N_k):
        # Get index of max value in heatmap
        idx = torch.argmax(heatmap[i])
        y, x = divmod(idx.item(), W)  # Convert to (y, x) coordinates
        keypoints.append((x, y))

    return keypoints

def get_gaussian_scoremap(
    shape, 
    keypoint: np.ndarray, 
    sigma: float=1, dtype=np.float32) -> np.ndarray:
    """
    Generate a image of shape=:shape:, generate a Gaussian distribtuion
    centered at :keypont: with standard deviation :sigma: pixels.
    keypoint: shape=(2,)
    """
    coord_img = np.moveaxis(np.indices(shape),0,-1).astype(dtype)
    sqrt_dist_img = np.square(np.linalg.norm(
        coord_img - keypoint[::-1].astype(dtype), axis=-1))
    scoremap = np.exp(-0.5/np.square(sigma)*sqrt_dist_img)

    return scoremap

def reflect_point_across_line(P, A, B):
    """
    Reflects point P across the line formed by points A and B.
    
    P, A, B are NumPy arrays of shape (2,) representing (x, y) coordinates.
    """
    x0, y0 = P
    x1, y1 = A
    x2, y2 = B
    
    # Compute line coefficients: ax + by + c = 0
    a = y2 - y1
    b = x1 - x2
    c = x2 * y1 - x1 * y2

    # Compute the reflected point
    d = (a * x0 + b * y0 + c) / (a**2 + b**2)
    x_reflected = x0 - 2 * a * d
    y_reflected = y0 - 2 * b * d
    
    return np.array([x_reflected, y_reflected])