import os
import cv2
import torch
from torch.utils.data import Dataset
from utils.utils import extract_number
from loguru import logger

class Deepfashion_Dataset(Dataset):
    def __init__(self, dataset_path):
        super().__init__()
        self.dataset_path = dataset_path
        assert os.path.isdir(self.dataset_path), f"{dataset_path} is not a valid directory."

        self.images = sorted(os.listdir(f"{dataset_path}/img"), key=extract_number)
        self.annotations = self.load_annotations()

        logger.info(f"Created Deep Fashion Dataset with {len(self.images)} images.")


    def load_annotations(self):
        with open(f"{self.dataset_path}/list_landmarks.txt",'r') as file:
            annotations = file.readlines()[2:]

        return annotations
    
    def load_img(self, img_name):
        img_path = os.path.join(self.dataset_path, 'img', img_name)  
        img = cv2.imread(img_path)
        img = torch.tensor(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).float()

        return img
    
    def pad_kpts(self, kpts, clothing_type):

        kpts_reshape = kpts.reshape([-1,3])
        num_kpts = kpts_reshape.shape[0]
        k = 8 - num_kpts
        if clothing_type == 1:      # Upper body clothes
            padding = torch.tensor([[2,0,0]]).repeat(k,1)

            padded_kpts = torch.concat([kpts_reshape[:4,:],padding, kpts_reshape[4:,:]], dim=0)
            padded_kpts = padded_kpts.flatten()
        elif clothing_type == 2:    # Lower body clothes
            padding = torch.tensor([[2,0,0]]).repeat(k,1)
            padded_kpts = torch.concat([padding,kpts_reshape], dim=0)
            padded_kpts = padded_kpts.flatten()
        else:
            padded_kpts = kpts

        return padded_kpts
            
    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        # Load image
        img_name = self.images[idx]  
        img_path = os.path.join(self.dataset_path, 'img', img_name)  
        img = cv2.imread(img_path)
        img = torch.tensor(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).float()/255

        # Load keypoints
        annotation = self.annotations[idx]
        parts = annotation.strip().split()
        clothing_type = int(parts[1])
        kpts = torch.tensor([int(x) for x in parts[3:]])
        kpts = self.pad_kpts(kpts, clothing_type)

        return img_name, img, kpts






        
