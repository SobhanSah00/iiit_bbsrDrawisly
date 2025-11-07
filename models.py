from pydantic import BaseModel
from typing import List, Dict

class DescriptionModel(BaseModel):
    user_id : str
    skill_set : List[Dict]