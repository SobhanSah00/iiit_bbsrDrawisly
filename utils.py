from pinecone import Pinecone, ServerlessSpec
import json
from typing import Dict, List, Tuple, Any
import uuid

from prompts import ambigous_checker_prompt
from config import (
    pc, EMBEDDING_MODEL, INDEX_NAME, INDEX_HOST, 
    NEED_INDEX_NAME, OFFER_INDEX_NAME, client, MODEL_NAME
)
from models import Prompt
from numpy import dot
from numpy.linalg import norm

def cosine_sim(a, b):
    return dot(a, b) / (norm(a) * norm(b))

def json_parser(response_str: str) -> Dict:
    """Parse JSON response string."""
    data = json.loads(response_str)
    return data

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
   # print(f"Embedding data: {data}")
    data_emb = EMBEDDING_MODEL.encode(data)
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
    
def push_db_need(user_id, embed, need_text):
    index_list = pc.list_indexes().names()
    if NEED_INDEX_NAME not in index_list:
        print('Creating New Index', NEED_INDEX_NAME)
        pc.create_index(
            name=NEED_INDEX_NAME,
            dimension=768, 
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    index = pc.Index(NEED_INDEX_NAME)
    print(f"Pushing embedding to Pinecone: {user_id}")
    index.upsert(
        vectors=[
            {
                "id": str(uuid.uuid4()),
                "values": embed,
                "metadata" : {
                    "user_id" : user_id,
                    "need_text" : need_text,
                     
                }
            }
        ]
    )
 
def get_need_emb(user_id):
    index = pc.Index(NEED_INDEX_NAME)
    results = index.query(
        vector = [0.0]*768,
        top_k = 100,
        filter={'user_id' : user_id},
        include_metadata=True,
        include_values=True,
    )
    first_vector = results["matches"][0]["values"]
    return first_vector
       
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
    return user_offer_emb_list
    
def search_offer_db(prompt_emb, top_k = 5):
    index = pc.Index(NEED_INDEX_NAME)
    results = index.query(
        vector=prompt_emb,
        top_k=top_k,
        include_metadata=True
    )
    return results
    
def search_db_by_user_id(user_id):
    index = pc.Index(NEED_INDEX_NAME)
    
def create_new_index(name: str = INDEX_NAME) -> None:
    """Create a new Pinecone index."""
    pc.create_index(
        name=name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )


def format_skill_text(skill: Dict) -> str:
    """Format skill data into text for embedding."""
    return (
        f"{skill['skill_name']} ({skill['experience_level']}) "
        f"focused on {skill.get('focus_area', '')}. "
        f"{skill['description']}"
    )


def create_skill_metadata(user_id: str, skill: Dict, text_to_embed: str) -> Dict:
    """Create metadata dictionary for a skill."""
    metadata = {
        "user_id": user_id,
        "text_to_embed": text_to_embed,
        "skill_name": skill.get("skill_name"),
        "experience_level": skill.get("experience_level"),
        "focus_area": skill.get("focus_area"),
        "components": skill.get("components"),
        "tools": skill.get("tools"),
        "description": skill.get("description"),
    }
    return {k: v for k, v in metadata.items() if v is not None}


def upload_skills_to_index(user_data: Dict, index_name: str) -> Any:
    """Upload user skills to specified Pinecone index."""
    # Ensure index exists
    existing_indexes = pc.list_indexes().names()
    if index_name not in existing_indexes:
        print(f"Index '{index_name}' not found — creating it...")
        create_new_index(index_name)
    else:
        print(f"Index '{index_name}' already exists.")

    index = pc.Index(index_name)
    vectors = []
    user_id = user_data["user_id"]

    for i, skill in enumerate(user_data["skill_set"]):
        text_to_embed = format_skill_text(skill)
        emb = get_emb(text_to_embed)
        metadata = create_skill_metadata(user_id, skill, text_to_embed)
        vector_id = f"{user_id}_skill_{i}_{skill['skill_name'].replace(' ', '_')}"
        vectors.append((vector_id, emb, metadata))

    upsert_response = index.upsert(vectors=vectors, namespace="__default__")
    print(f"Uploaded {len(vectors)} vectors for user {user_id}")
    print("Upsert response:", upsert_response)
    return upsert_response


def upload_pinecone(user_data: Dict, where: str) -> Any:
    """
    Upload user data to Pinecone index.
    
    Args:
        user_data: Dictionary containing user information and skill_set
        where: Either "need" or "offer" to specify target index
    
    Returns:
        Upsert response from Pinecone
    """
    if where == "need":
        return upload_skills_to_index(user_data, NEED_INDEX_NAME)
    elif where == "offer":
        return upload_skills_to_index(user_data, OFFER_INDEX_NAME)
    else:
        raise ValueError(f"Invalid 'where' parameter: {where}. Must be 'need' or 'offer'")


def get_topk_records(q_emb: List[float], index_name: str = INDEX_NAME, top_k: int = 13) -> Dict:
    """Query Pinecone index for top-k similar vectors."""
    index = pc.Index(index_name)
    matches = index.query(
        namespace="__default__",
        vector=q_emb, 
        top_k=top_k,
        include_metadata=True,
        include_values=False
    )
    return matches.to_dict()


def get_user_offers(user_prof: Dict) -> List[Dict]:
    """Extract user's offered skills from profile."""
    return user_prof.get("skill_set", [])


def get_offers_user_list(matches: Dict) -> List[str]:
    """Extract unique user IDs from query matches."""
    user_ids = set()
    for match in matches.get("matches", []):
        metadata = match.get("metadata", {})
        user_id = metadata.get("user_id")
        if user_id:
            user_ids.add(user_id)
    return list(user_ids)


def get_compatible_user_id(offers_user_list: List[str], user_prof: Dict, want_query: str) -> List[str]:
    """
    Find compatible users by checking if they need what the current user offers.
    
    Args:
        offers_user_list: List of user IDs who offer what the current user needs
        user_prof: Current user's profile
        want_query: What the current user wants/needs
    
    Returns:
        List of compatible user IDs
    """
    compatible_users = []
    user_id = user_prof.get("user_id")
    user_offers = get_user_offers(user_prof)
    
    # For each potential match, check if they need what we offer
    for offer_text in [format_skill_text(skill) for skill in user_offers]:
        offer_emb = get_emb(offer_text)
        # Query the NEED index to see if any of these users need what we offer
        need_matches = get_topk_records(offer_emb, NEED_INDEX_NAME)
        
        for match in need_matches.get("matches", []):
            match_user_id = match.get("metadata", {}).get("user_id")
            # If this user is in our offers_user_list and needs what we offer
            if match_user_id in offers_user_list and match_user_id != user_id:
                if match_user_id not in compatible_users:
                    compatible_users.append(match_user_id)
    
    return compatible_users


def get_top_compatible_pairs(search_query: SearchQuery) -> List[str]:
    """
    Find top compatible user pairs for skill exchange.
    
    Args:
        search_query: SearchQuery object containing query and user profile
    
    Returns:
        List of compatible user IDs
    """
    want = search_query.query
    user_prof = search_query.user_profile
    user_id = user_prof.get("user_id")
    
    # Get embedding for what user wants
    want_emb = get_emb(want)
    
    # Find users who offer what we want (query OFFER index)
    one_way_want_matches = get_topk_records(want_emb, OFFER_INDEX_NAME)
    
    # Extract user IDs from matches
    offers_user_list = get_offers_user_list(one_way_want_matches)
    
    # Find which of these users also need what we offer (mutual match)
    compatible_users_id = get_compatible_user_id(offers_user_list, user_prof, want)
    
    return compatible_users_id