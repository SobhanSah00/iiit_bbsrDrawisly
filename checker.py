from config import client, MODEL_NAME
from pipelines import SanitizePipeline


contents = "Explain how AI works in a few words ?"

user_desc = "i am a mern stack dev, mainly on backend techs, and recentply i have started exploring devops, and i have a good grasph on dsa"
response = SanitizePipeline().get_sanitized_description(user_desc=user_desc)

print(response)