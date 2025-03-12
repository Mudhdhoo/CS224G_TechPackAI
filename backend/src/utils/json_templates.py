from pydantic import BaseModel

class ImageNamesTemplate(BaseModel):
    image_names: list[str]

class FilteredKeypointsTemplate(BaseModel):
    filtered_kpts: list[int]