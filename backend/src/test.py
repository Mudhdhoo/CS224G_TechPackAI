
# from openai import OpenAI
# client = OpenAI()

# response = client.images.edit(
#     model="dall-e-2",
#     image=open("/Users/johncao/Documents/Programming/Stanford/CS224G/src/square_image.png", "rb"),
#     mask=open("/Users/johncao/Documents/Programming/Stanford/CS224G/src/transparent_mask.png", "rb"),
#     prompt="An image of a blazer, someone has drawn a red hollow transparent circle on it",
#     n=1,
#     size="512x512",
# )

# print(response.data[0].url)

# import cv2
# import numpy as np

# # Load the image into a numpy array
# image_path = "/Users/johncao/Documents/Programming/Stanford/CS224G/illustration/illustration2.png"
# image = cv2.imread(image_path)

# # Define points of interest (example coordinates, adjust as needed)
# points_of_interest = [(200,50), (80,130), (210,130)]

# # Modify the image by adding red dots to interesting sections
# for point in points_of_interest:
#     cv2.circle(image, point, 3, (0, 0, 255), -1)

# cv2.imshow("Highlighted Areas", image)
# cv2.waitKey(0)
# cv2.destroyAllWindows()

from fastapi import FastAPI

# Create a FastAPI instance
app = FastAPI()

# Define a simple route
@app.get("/")
def read_root():
    return {"message": "Heldsalo, FastAPI!"}

