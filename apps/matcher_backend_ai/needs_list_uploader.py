import json
import requests

with open("needs_list.json", "r") as f:
    data = json.load(f)

url = "http://127.0.0.1:8000/embed-need"

for need in data["needs"]:
    print(f"Uploading need for user_id={need['user_id']} ...")
    

    response = requests.post(url, json=need)
    
    if response.status_code == 200:
        print("✅ Success:", response.json())
    else:
        print("❌ Failed:", response.status_code, response.text)
