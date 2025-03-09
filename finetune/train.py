import torch
import torch.optim as optim
from models.models import ViTFashionDetector
from Deepfashion_Dataset import Deepfashion_Dataset
from torch.utils.data import DataLoader
from torch import nn
from loguru import logger
import argparse
import numpy as np
from tqdm import tqdm
import os
import matplotlib.pyplot as plt
from utils.utils import save_learning_curve, save_checkpoint, load_checkpoint
from losses import JointsMSELoss

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="../deepfashion/", help="Directory where your data files are located")
    parser.add_argument("--batch_size", type=int, default=256, help="Batch size for training")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs")
    parser.add_argument("--scheduler_step_size", type=int, default=15, help="LR scheduler step size.")
    parser.add_argument("--scheduler_gamma", type=float, default=0.1, help="LR scheduler decay factor.")
    parser.add_argument("--lr", type=float, default=5e-4, help="Learning Rate")
    parser.add_argument("--weight_decay", type=float, default=0.01, help="Weight Decay")
    parser.add_argument("--save_every", type=int, default=5, help="Save frequency.")
    parser.add_argument("--num_workers", type=int, default=9, help="Number of workers.")
    parser.add_argument("--output_dir", type=str, default="./outputs", help="Directory to save outputs")
    parser.add_argument("--resume", type=str, default=None, help="Path to a checkpoint to resume training")

    return parser.parse_args()

def main():
    args = get_args()
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    dataset = Deepfashion_Dataset(args.data_dir, img_size=(256, 192), scale_factor=4, clothing_type="upper_body")
    dataloader = DataLoader(dataset, args.batch_size, shuffle=True, collate_fn=None, num_workers=args.num_workers)

    model = ViTFashionDetector(num_labels=6).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=args.scheduler_step_size, gamma=args.scheduler_gamma)
    #criterion = JointsMSELoss() #nn.BCEWithLogitsLoss()
    criterion = nn.MSELoss()

    # Lists to track learning curve
    epochs = []
    train_losses = []
    start_epoch = 0

    # Check if resuming from a checkpoint
    if args.resume:
        start_epoch, previous_losses = load_checkpoint(
            args.resume, model, optimizer, scheduler
        )
        # Extend or replace existing losses
        train_losses = previous_losses
        epochs = list(range(1, start_epoch + 1))

    for epoch in range(start_epoch, args.epochs):
        model.train()  # Set model to training mode
        epoch_losses = []
        
        for idx, batch in enumerate(tqdm(dataloader, desc=f"Epoch-{epoch+1}")):
            names, images, kpts, score_maps = batch
            images, score_maps = images.to(device), score_maps.to(device)
            pred_maps = model(images)
            loss = criterion(score_maps, pred_maps['heatmaps'])
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            epoch_losses.append(loss.item())
            if ((idx+1) % 100) == 0:
                logger.info(f"Loss: {loss.item()}")

        scheduler.step()
        lr = optimizer.param_groups[0]['lr']
        mean_epoch_loss = np.mean(epoch_losses)
        logger.info(f"Epoch {epoch+1}: Mean Loss={mean_epoch_loss}, Learning Rate={lr}")
        # Store for learning curve
        epochs.append(epoch + 1)
        train_losses.append(mean_epoch_loss)
        
        # Save model checkpoint and learning curve
        if ((epoch+1) % args.save_every) == 0:
            save_learning_curve(epochs, train_losses, args.output_dir)
            save_checkpoint(model, optimizer, scheduler, epoch, train_losses, args.output_dir)
    
    # Save final learning curve data as numpy arrays for future reference
    np.save(os.path.join(args.output_dir, 'epochs.npy'), epochs)
    np.save(os.path.join(args.output_dir, 'train_losses.npy'), train_losses)
    
    # Save final model
    final_model_path = os.path.join(args.output_dir, 'final_model.pth')
    torch.save(model.state_dict(), final_model_path)
    logger.info(f"Saved final model to {final_model_path}")

if __name__ == "__main__":
    main()