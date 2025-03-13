from pydantic import BaseModel

class ImageNamesTemplate(BaseModel):
    image_names: list[str]

class FilteredKeypointsTemplate(BaseModel):
    filtered_kpts: list[int]

class DrawingCodeTemplate(BaseModel):
    front_code: str
    back_code: str

class FullTemplate(BaseModel):
    template_code: str