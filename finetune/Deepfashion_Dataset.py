import os
from PIL import Image
import torch
import numpy as np
from torch.utils.data import Dataset
from utils.utils import extract_number
from torchvision import transforms
from loguru import logger
from utils.keypoints import get_gaussian_scoremap

class Deepfashion_Dataset(Dataset):
    def __init__(self, dataset_path, img_size = (256, 192), scale_factor=4):
        super().__init__()
        self.dataset_path = dataset_path
        assert os.path.isdir(self.dataset_path), f"{dataset_path} is not a valid directory."
        self.img_size = img_size
        self.scale_factor = scale_factor
        self.images = sorted(os.listdir(f"{dataset_path}/img"), key=extract_number)
        self.annotations = self.load_annotations()
        self.transforms = transforms.Compose([
            transforms.Resize(self.img_size),
            transforms.ToTensor(),  # Convert image to tensor (scales to [0,1])
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize
        ])

        logger.info(f"Created Deep Fashion Dataset with {len(self.images)} images.")


    def load_annotations(self):
        with open(f"{self.dataset_path}/list_landmarks.txt",'r') as file:
            annotations = file.readlines()[2:]

        return annotations
    
    def load_img(self, img_name):
        img_path = os.path.join(self.dataset_path, 'img', img_name)  
        img = Image.open(img_path)
        img = torch.tensor(img)

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
            
    def collate_fn(self, batch):
        names, imgs, kpts, score_maps = batch

        return torch.stack(imgs), torch.stack(score_maps)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        # Load image
        img_name = self.images[idx]  
        img_path = os.path.join(self.dataset_path, 'img', img_name)  
        img = Image.open(img_path)
        W, H = img.size
        img = self.transforms(img)

        # Load keypoints
        annotation = self.annotations[idx]
        parts = annotation.strip().split()
        clothing_type = int(parts[1])
        kpts = torch.tensor([int(x) for x in parts[3:]])
        kpts = self.pad_kpts(kpts, clothing_type).reshape([8,3])
        visibility_ind = kpts[:,0]
        kpts =  kpts[:,1:]
        kpts[:,0] = kpts[:,0]*(self.img_size[1]/W)
        kpts[:,1] = kpts[:,1]*(self.img_size[0]/H)

        score_maps = []
        for idx, kp in enumerate(kpts):
            if visibility_ind[idx] == 2:
                score_map = np.zeros([self.img_size[0]//self.scale_factor, self.img_size[1]//self.scale_factor])
            else:
                score_map = get_gaussian_scoremap((self.img_size[0]//self.scale_factor, self.img_size[1]//self.scale_factor), np.array(kp)/4, sigma=2)
            score_maps.append(torch.from_numpy(score_map))
        score_maps = torch.stack(score_maps, dim=0)

        return img_name, img, kpts, score_maps






        
