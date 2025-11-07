from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel

# class EmbedDescription(BaseModel):
#     description : str
    
app = FastAPI()

@app.get("/")
def health_check():
    return {
        "Message" : "ALIVEEEEE"
    }

@app.post("/embed_description")
def description_emebedding(description : str):
    if description == '':
        raise HTTPException(status_code=401, detail="Description can't be none")
    
    