from prompts import sanitizing_prompt
from config import client, MODEL_NAME

class SanitizePipeline:
    def __init__(self):
        pass
    def get_sanitized_description(self, user_desc : str):
        """Performs query expansion"""
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=sanitizing_prompt + user_desc,
            )
        return response.text
        
        
        
        
class NoteMakingPipeline:
    def __init__(self):
        pass