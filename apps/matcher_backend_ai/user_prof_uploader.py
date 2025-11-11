import json
import requests

with open("user_prof.json", "r") as f:
    data = json.load(f)

url = "http://127.0.0.1:8000/user-profile-upload"

for user in data["users"][:-5]:
    print(f"Uploading user_id={user['user_id']} ...")
    
    response = requests.post(url, json=user)

    if response.status_code == 200:
        print("✅ Success:", response.json())
    else:
        print("❌ Failed:", response.status_code, response.text)
