import os
from PIL import Image
import torch
import numpy as np
from torch.utils.data import Dataset
from utils.utils import extract_number
from torchvision import transforms
from loguru import logger
from utils.keypoints import get_gaussian_scoremap, kp2ind, reflect_point_across_line, augment_upper_body_kpts
    
class Deepfashion_Dataset(Dataset):
    def __init__(self, dataset_path, img_size = (256, 192), scale_factor=4, clothing_type='upper_body', augment=False):
        super().__init__()
        assert os.path.isdir(dataset_path), f"{dataset_path} is not a valid directory."
        assert clothing_type in ['upper_body', 'lower_body', 'full_body']

        self.dataset_path = dataset_path
        self.img_size = img_size
        self.scale_factor = scale_factor
        self.augment = augment
        self.clothing_type = clothing_type
        self.annotations, self.images = self.load_data(clothing_type)
        self.kp2ind = kp2ind[clothing_type]
        self.transforms = transforms.Compose([
            transforms.Resize(self.img_size),
            transforms.ToTensor(),  # Convert image to tensor (scales to [0,1])
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize
        ])

        logger.info(f"Created Deep Fashion Dataset with {len(self.images)} {clothing_type} images.")


    def load_data(self, clothing_type):
        images = []
        ann_list = []
        with open(f"{self.dataset_path}/list_landmarks.txt",'r') as file:
            annotations = file.readlines()[2:]

        for anno in annotations:
            attributes = anno.split()
            if clothing_type == "upper_body" and attributes[1] == '1':
                ann_list.append(attributes)
                images.append(attributes[0])
            elif clothing_type == "lower_body" and attributes[1] == '2':
                ann_list.append(attributes)
                images.append(attributes[0])
            elif clothing_type == "full_body" and attributes[1] == '3':
                ann_list.append(attributes)
                images.append(attributes[0])
            

        return ann_list, images
    
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
    
    def augment_kpts(self, kpts, visibility_ind):
        H, W = self.img_size
        if self.clothing_type == 'upper_body':
            kpts = augment_upper_body_kpts(kpts)
            visibility_ind.extend([1,1,1,1,1,1,1,1,1])

        return kpts, visibility_ind

            
    def collate_fn(self, batch):
        names, imgs, kpts, score_maps = batch

        return torch.stack(imgs), torch.stack(score_maps)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        # Load image
        img_name = self.images[idx]  
        img_path = os.path.join(self.dataset_path, img_name)  
        img = Image.open(img_path)
        W, H = img.size
        img = self.transforms(img)

        # Load keypoints
        parts = self.annotations[idx]
        kpts = torch.tensor([int(x) for x in parts[3:]]).reshape([len(parts[3:])//3,3])
        visibility_ind = list(kpts[:,0])
        kpts =  kpts[:,1:]
        kpts[:,0] = kpts[:,0]*(self.img_size[1]/W)
        kpts[:,1] = kpts[:,1]*(self.img_size[0]/H)
        if self.augment:
            kpts, visibility_ind = self.augment_kpts(kpts, visibility_ind)

        score_maps = []         
        for idx, kp in enumerate(kpts):
            if visibility_ind[idx] == 2:
                score_map = np.zeros([self.img_size[0]//self.scale_factor, self.img_size[1]//self.scale_factor])
            else:
                score_map = get_gaussian_scoremap((self.img_size[0]//self.scale_factor, self.img_size[1]//self.scale_factor), np.array(kp)/4, sigma=2)
            score_maps.append(torch.from_numpy(score_map))
        score_maps = torch.stack(score_maps, dim=0)

        return img_name, img.float(), kpts, score_maps.float()
    
if __name__ == "__main__":
    dataset_path = "../deepfashion"
    dataset = Deepfashion_Dataset(dataset_path,clothing_type='upper_body')
    print(dataset[0][3].shape)







        
