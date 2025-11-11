from pinecone import Pinecone, ServerlessSpec
import json
from typing import Dict, List, Tuple, Any
import uuid

from prompts import ambiguous_checker_prompt, get_prerequisite_prompt
from config import (
    pc, EMBEDDING_MODEL, INDEX_NAME, INDEX_HOST, 
    NEED_INDEX_NAME, OFFER_INDEX_NAME, client, MODEL_NAME
)

import numpy as np

def run_ambiguity_checker(query):
    content = ambiguous_checker_prompt.format(query = query)
    response = client.models.generate_content(
        model = MODEL_NAME,
        contents = content,
    )
    reponse = response.text
    parsed_response = json_parser(reponse)
    return parsed_response

def get_similarity(offer_list, need_emb):
    offer_list_np = np.array(offer_list) 
    need_emb_np = np.array(need_emb)      
    sim_scores = offer_list_np @ need_emb_np

    best_idx = int(np.argmax(sim_scores))
    best_score = float(sim_scores[best_idx])
    return best_score, best_idx

import json
from typing import Dict

def json_parser(response_str: str) -> Dict:
    """Safely parse JSON string returned by model."""
    # Handle None or empty responses
    if not response_str or not response_str.strip():
        print("⚠️ Warning: Empty response string.")
        return {
            "ambiguous": True,
            "reason": "Empty or null response from model.",
            "suggestions": []
        }

    try:
        # Try direct parse first
        return json.loads(response_str)
    except json.JSONDecodeError:
        # Attempt to extract JSON-like portion if extra text exists
        start = response_str.find("{")
        end = response_str.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(response_str[start:end])
            except json.JSONDecodeError:
                pass  # fall through to fallback

        # Log the malformed response for debugging
        print("❌ JSON Parse Error: Invalid JSON format.")
        print("Response was:\n", response_str)

        # Fallback response if parsing fails
        return {
            "ambiguous": True,
            "reason": "Model returned invalid JSON.",
            "suggestions": []
        }

def check_ambiguity(query: str) -> str:
    """Check if query is ambiguous using LLM."""
    content = ambigous_checker_prompt.format(query=query)
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=content, 
    )
    print(response.text)
    return response.text


def get_emb(data):
   # pruser_offerings_strint(f"Embedding data: {data}")
    data_emb = EMBEDDING_MODEL.encode(data, normalize_embeddings=True)
    return data_emb.tolist()

def push_db_offer(user_id, embed, combined_text):
    index_list = pc.list_indexes().names()
    if OFFER_INDEX_NAME not in index_list:
        print('Creating New Index', OFFER_INDEX_NAME)
        pc.create_index(
            name=OFFER_INDEX_NAME,
            dimension=768, 
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    index = pc.Index(OFFER_INDEX_NAME)
    print(f"Pushing embedding to Pinecone: {user_id}")
    index.upsert(
        vectors = [
            {
                "id" : str(uuid.uuid4()),
                "values" : embed,
                "metadata" : {
                    'user_id' : user_id,
                    'combined_text' : combined_text,
                 }
            }
        ]
    )
    
import time
from pinecone import ServerlessSpec

def push_db_need(user_id, embed, need_text):
    index_list = pc.list_indexes().names()
    
    if NEED_INDEX_NAME not in index_list:
        print('Creating New Index:', NEED_INDEX_NAME)
        pc.create_index(
            name=NEED_INDEX_NAME,
            dimension=768, 
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        
        # CRITICAL: Wait for index to be ready
        print('Waiting for index to initialize...')
        while not pc.describe_index(NEED_INDEX_NAME).status['ready']:
            print('...still waiting...')
            time.sleep(2)
        print('✅ Index ready!')
    
    index = pc.Index(NEED_INDEX_NAME)
    print(f"Pushing embedding to Pinecone: user_id={user_id}")
    
    index.upsert(
        vectors=[
            {
                "id": str(uuid.uuid4()),
                "values": embed,
                "metadata": {
                    "user_id": user_id,
                    "need_text": need_text,
                }
            }
        ]
    )
    
    return {"status": "success"}
 
def get_need_emb(user_id):
    index = pc.Index(NEED_INDEX_NAME)
    results = index.query(
        vector=[0.0]*768,
        top_k=100,
        filter={'user_id': user_id},
        include_metadata=True,
        include_values=True,
    )
    #print(results)
    
    # Handle case where no results are found
    if not results.get("matches"):
        return None, None
    
    # Get the first match
    first_match = results["matches"][0]
    first_vector = first_match["values"]
    need_str = first_match['metadata']['need_text']
    
    return first_vector, need_str
       
def retrive_offer_emb(user_id):
    index = pc.Index(OFFER_INDEX_NAME)
    results = index.query(
        vector=[0.0]*768,
        top_k=100,
        filter={'user_id' : user_id},
        include_metadata=True,
        include_values=True
    )
    user_offer_emb_list = [match["values"] for match in results["matches"]]
    user_offerings_str = [match['metadata']['combined_text'] for match in results["matches"]]
    return user_offer_emb_list, user_offerings_str
    
def search_offer_db(prompt_emb, top_k = 5):
    index = pc.Index(OFFER_INDEX_NAME)
    results = index.query(
        vector=prompt_emb,
        top_k=top_k,
        include_metadata=True
    )
    return results
    