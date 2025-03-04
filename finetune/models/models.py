import torch
from torch import nn
from transformers import VitPoseForPoseEstimation
from loguru import logger

class ViTFashionDetector(nn.Module):
    def __init__(self, num_labels=8):
        super().__init__()
        self.model = VitPoseForPoseEstimation.from_pretrained("usyd-community/vitpose-base-simple")
        self.model.head.conv = nn.Conv2d(
            self.model.config.backbone_config.hidden_size, num_labels, kernel_size=3, stride=1, padding=1
        )
        
    def forward(self, x):
        return self.model(x)

if __name__ == "__main__":
    model = ViTFashionDetector()
    x = torch.randn([1,3,256,192])
    print(model(x)['heatmaps'].shape)