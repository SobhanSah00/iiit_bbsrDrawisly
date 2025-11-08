from pydantic import BaseModel
from typing import List, Optional

class SkillModel(BaseModel):
    skill_name: str
    components: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    focus_area: Optional[str] = None
    experience_level: str
    description: str

class DescriptionModel(BaseModel):
    user_id: str
    skill_set: List[SkillModel]

class Need(BaseModel):
    user_id : str
    need_str : str
class Prompt(BaseModel):
    query: str
    user_profile : DescriptionModel