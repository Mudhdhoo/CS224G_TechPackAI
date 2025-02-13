from models import OpenAI_GPT
from utils.utils import encode_image
import os

class TechPack_Assistant:
    def __init__(self, model, reference_dir, illustration_dir, brand_name, designer_name, **kwargs):
        self.brand_name = brand_name
        self.designer_name = designer_name
        
        references = [os.path.join(reference_dir, f) for f in os.listdir(reference_dir) 
                    if os.path.isfile(os.path.join(reference_dir, f)) and f != ".DS_Store"]

        illustrations = [os.path.join(illustration_dir,f) for f in os.listdir(illustration_dir)
                          if os.path.isfile(os.path.join(illustration_dir, f)) and f != ".DS_Store"]

        if "model_name" in kwargs.keys():
            self.model = model(kwargs["model_name"])
        else:
            self.model = model()
            
        self.reference_images = self.encode_images(references)
        self.illustration_images = self.encode_images(illustrations)

    def chat(self):
        response = self.model.init_conversation(self.reference_images, 
                                                self.illustration_images, 
                                                self.brand_name, 
                                                self.designer_name)
        print(response)
        while True:
            user_input = input(":")
            response = self.model.chat(user_input)
            print(response)


    def encode_images(self, img_dirs):
        encoded_images = []
        for img in img_dirs:
            encoded_images.append(encode_image(img))

        return encoded_images
        
        

if __name__ == "__main__":
    model = OpenAI_GPT
    brand = "Björn Borg"
    agent = TechPack_Assistant(model=model, brand=brand, model_name='gpt-4o-mini')