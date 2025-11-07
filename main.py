from fastapi import FastAPI, Request, HTTPException
from models import DescriptionModel
    
app = FastAPI()

@app.get("/")
def health_check():
    return {
        "Message" : "ALIVEEEEE"
    }

@app.post("/embed_description")
async def description_emebedding(data : DescriptionModel):
    
    
    if description == '':
        raise HTTPException(status_code=401, detail="Description can't be none")
    
    
    
    