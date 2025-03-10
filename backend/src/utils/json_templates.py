from pydantic import BaseModel

class ImageNamesTemplate(BaseModel):
    image_names: list[str]