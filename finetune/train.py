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

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="../deepfashion/", help="Directory where your data files are located")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size for training")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--scheduler_step_size", type=int, default=40, help="LR scheduler step size.")
    parser.add_argument("--scheduler_gamma", type=float, default=0.1, help="LR scheduler decay factor.")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning Rate")
    parser.add_argument("--weight_decay", type=float, default=0.1, help="Weight Decay")

    return parser.parse_args()

def main():
    args = get_args()
    dataset = Deepfashion_Dataset(args.data_dir, img_size=(256, 192),scale_factor=4)
    dataloader = DataLoader(dataset, args.batch_size, shuffle=True, collate_fn=None)

    model = ViTFashionDetector(num_labels=8)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=args.scheduler_step_size, gamma=args.scheduler_gamma)
    criterion = nn.BCEWithLogitsLoss()

    for epoch in range(args.epochs):
        loss_list = []
        for batch in tqdm(dataloader, desc=f"Epoch-{epoch+1}"):
            names, images, kpts, score_maps = batch
            pred_maps = model(images)
            loss = criterion(score_maps, pred_maps['heatmaps'])
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            scheduler.step()
            loss_list.append(loss.item())
            print(loss.item())
        logger.info(np.mean(loss_list))






if __name__ == "__main__":
    main()