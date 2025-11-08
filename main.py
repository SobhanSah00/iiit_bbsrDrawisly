from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import numpy as np


from models import DescriptionModel, Prompt, Need
from utils import ( 
    get_emb, 
    cosine_sim,
    push_db_need,
    push_db_offer,
    search_offer_db,
    retrive_offer_emb,
    get_need_emb,
)
from config import NEED_INDEX_NAME, OFFER_INDEX_NAME

load_dotenv()

app = FastAPI(
    title="Skill Embedding Service",
    description="API to embed user skill descriptions and push to Pinecone.",
    version="1.0.0"
)



@app.get('/')
def status():
    return {'message' : 'ALIVE'}

@app.post('/embed-need')
def embed_need(need : Need):
    embed = get_emb(need.need_str)
    response = push_db_need(need.user_id,embed, need.need_str)
    # print(len(response))
    return {'message' : 'stored message'}

@app.post('/user-profile-upload')
def upload_user_profile(user : DescriptionModel):
    user = user.dict()
    user_id = user['user_id']
    skill_set = user['skill_set']
    combined_text = ""
    for skill in skill_set:
        combined_text += (
                f"Skill: {skill['skill_name']}. "
                f"Focus Area: {skill['focus_area']}. "
                f"Experience Level: {skill['experience_level']}. "
                f"Components: {', '.join(skill['components'])}. "
                f"Tools: {', '.join(skill['tools'])}. "
                f"Description: {skill['description']} "
            ) 
        emb = get_emb(combined_text)
        response = push_db_offer(user_id, emb, combined_text)
    return {'message' : 'sent to need db', "response" : response}

@app.post('/compatible-users')
def find_compatible_users(prompt: Prompt):
    try:
        prompt_dict = prompt.dict()
        query = prompt_dict['query']
        user_profile = prompt_dict['user_profile']
        user_id = user_profile['user_id']
        
        prompt_emb = get_emb(query)
        top_k_matches = search_offer_db(prompt_emb)
        matches = top_k_matches['matches']

        user_offer_emb_list = retrive_offer_emb(user_id)
        
        if not user_offer_emb_list:
            return {
                "status": "error",
                "message": f"No offers found for user {user_id}",
                "compatible_users": []
            }
        
        print(f"User {user_id} has {len(user_offer_emb_list)} offers")
        
        # Store unique users to avoid duplicates
        seen_users = set()
        compatibility_results = []
        
        for entry in matches:
            probable_compatible_u_id = entry['metadata']['user_id']
            need_to_off_score = entry['score']
            
            if probable_compatible_u_id in seen_users:
                continue
            seen_users.add(probable_compatible_u_id)

            if probable_compatible_u_id == user_id:
                continue
            
            need_emb_of_probable = get_need_emb(probable_compatible_u_id)
            
            if not need_emb_of_probable or len(need_emb_of_probable) != 768:
                print(f"No valid need embedding for user {probable_compatible_u_id}, skipping...")
                continue
            
            reverse_scores = []
            
            for our_offer_emb in user_offer_emb_list:
                dot_product = sum(a * b for a, b in zip(our_offer_emb, need_emb_of_probable))
                norm_a = sum(a * a for a in our_offer_emb) ** 0.5
                norm_b = sum(b * b for b in need_emb_of_probable) ** 0.5
                cosine_similarity = dot_product / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0
                reverse_scores.append(cosine_similarity)
            
            best_reverse_score = max(reverse_scores) if reverse_scores else 0.0
            
            mutual_score = (need_to_off_score + best_reverse_score) / 2
            
            compatibility_result = {
                "candidate_user_id": probable_compatible_u_id,
                "forward_score": float(need_to_off_score),
                "reverse_score": float(best_reverse_score),
                "mutual_score": float(mutual_score)
            }
            
            compatibility_results.append(compatibility_result)
            print(compatibility_result)
        
        compatibility_results.sort(key=lambda x: x['mutual_score'], reverse=True)
        
        print(f"\nFound {len(compatibility_results)} compatible users")
        
        return {
            "status": "success",
            "user_id": user_id,
            "query": query,
            "total_matches": len(compatibility_results),
            "compatible_users": compatibility_results
        }
        
    except Exception as e:
        print("❌ Exception during /compatible-users request:")
        raise HTTPException(status_code=500, detail=f"Compatibility search failed: {str(e)}")
# @app.post('/compatible-users')
# def find_compatible_users(prompt : Prompt):
#     prompt = prompt.dict()
#     query = prompt['query']
#     user_profile = prompt['user_profile']
#     user_id = user_profile['user_id']
#     prompt_emb = get_emb(query)
#     top_k_matches = search_offer_db(prompt_emb)
#     matches = top_k_matches['matches']
#     result = []
#     for entry in matches:
#         result.append([entry['metadata']['user_id'], entry['score']])
    
#     user_offer_emb_list = retrive_offer_emb(user_id)
   
    
#     for entry in result:
#             probable_compatible_u_id = entry[0]
#             need_to_off_score = entry[1]
#             need_emb_of_probable = get_need_emb(probable_compatible_u_id)
#             print(len(need_emb_of_probable))

#             reverse_scores = []

#             for our_offer_emb in user_offer_emb_list:
#                     dot_product = sum(a * b for a, b in zip(our_offer_emb, need_emb_of_probable))
#                     norm_a = sum(a * a for a in our_offer_emb) ** 0.5
#                     norm_b = sum(b * b for b in need_emb_of_probable) ** 0.5
#                     cosine_similarity = dot_product / (norm_a * norm_b) if norm_a != 0 and norm_b != 0 else 0.0
#                     reverse_scores.append(cosine_similarity)

#             best_reverse_score = max(reverse_scores) if reverse_scores else 0.0

#             mutual_score = (need_to_off_score + best_reverse_score) / 2

#             print({
#                 "candidate_user_id": probable_compatible_u_id,
#                 "forward_score": need_to_off_score,
#                 "reverse_score": best_reverse_score,
#                 "mutual_score": mutual_score
#             })

        
        
    
#     # print(result)
#     #for entry in result:
#     #     entry[0]
        
    
    
        
#     print(len(user_offer_emb_list))
#     # response = search_db_by_user_id(user_id)
    
#     pass
    
    
    
    
    
    
    
    
    
    
# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     """Handle validation errors with detailed debugging information."""
#     print("❌ Validation Error Details:")
#     print(exc.errors())
#     print("Request body:", exc.body)
#     return JSONResponse(
#         status_code=422,
#         content={"detail": exc.errors(), "body": str(exc.body)}
#     )


# @app.exception_handler(Exception)
# async def general_exception_handler(request: Request, exc: Exception):
#     """Catch-all exception handler for unhandled errors."""
#     print("❌ Unhandled Exception:")
#     traceback.print_exc()
#     return JSONResponse(
#         status_code=500,
#         content={
#             "detail": f"Internal server error: {str(exc)}",
#             "type": type(exc).__name__
#         }
#     )


# @app.get("/")
# def health_check() -> Dict[str, str]:
#     """Health check endpoint."""
#     return {"message": "ALIVEEEEE", "status": "running"}


# @app.post("/get-compatible-pairs")
# def find_mutual_pairs(searchQuery: SearchQuery) -> Dict[str, Any]:
#     try:
#         query = searchQuery.query
   
#         print(f"Checking ambiguity for query: {query}")
#         ambiguity_response = check_ambiguity(query)
  
#         try:
#             parsed_ambiguity_response = json_parser(ambiguity_response)
#         except Exception as parse_error:
#             print(f"⚠️ Failed to parse ambiguity response: {parse_error}")
#             parsed_ambiguity_response = {"ambiguous": False}
        
#         print(f"Ambiguity check result: {parsed_ambiguity_response}")
    
#         if parsed_ambiguity_response.get('ambiguous', False) or parsed_ambiguity_response.get('ambigous', False):
#             return {
#                 "message": "parsed_ambiguity_response",
#             }
    
#         print(f"Finding compatible pairs for user: {searchQuery.user_profile.get('user_id')}")
#         top_compatible_pairs = get_top_compatible_pairs(searchQuery)
        
#         return {
#             "compatible_users": top_compatible_pairs,
#         }
        
#     except Exception as e:
#         print("❌ Exception during /get-compatible-pairs request:")
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Failed to find compatible pairs: {str(e)}"
#         )


# @app.post('/retrieve-top-k')
# def retrieve_top_k(data: SearchQuery) -> Dict[str, Any]:

#     try:
#         query = data.query
#         index_name = getattr(data, 'index_name', NEED_INDEX_NAME)
#         top_k = getattr(data, 'top_k', 13)
        
#         print(f"Generating embedding for query: {query}")
#         q_emb = get_emb(query)
        
#         print(f"Searching index '{index_name}' for top {top_k} matches")
#         result = get_topk_records(q_emb, index_name=index_name, top_k=top_k)
        
#         return {
#             "status": "success",
#             "query": query,
#             "index": index_name,
#             "results": result
#         }
        
#     except Exception as e:
#         print("❌ Exception during /retrieve-top-k request:")
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Search failed: {str(e)}"
#         )


# @app.post("/embed-need")
# def embed_need(data: Need) -> Dict[str, Any]:
#     try:
#         need_text = data.need_str
#         print(f"Need description: {need_text}")
#         need_emb = get_emb(need_text)
#         user_id = data.user_id
#         from config import pc
#         need_index = pc.Index(NEED_INDEX_NAME)
        
#         metadata = {
#             "user_id": user_id,
#             "need_description": need_text,
#         }
        
#         vector_id = uuid.uuid4()
        
#         response = need_index.upsert(
#             vectors=[(vector_id, need_emb, metadata)],
#             namespace="__default__"
#         )
        
#         return {
#             "status": "success",
#             "type": "need",
#             "user_id": user_id,
#             "need_description": need_text,
#             "vector_id": vector_id,
#             "pinecone_response": str(response)
#         }

#     except Exception as e:
#         print("❌ Exception during /embed-need request:")
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Pinecone upload failed: {str(e)}"
#         )



# @app.post("/embed-offer")
# def embed_offer(data: DescriptionModel) -> Dict[str, Any]:
#     """
#     Embed user's skill OFFERS and upload to Pinecone OFFER index.
    
#     Args:
#         data: DescriptionModel containing user_id and skill_set
    
#     Returns:
#         Success status and upload details
#     """
#     try:
#         print(f"Received OFFER data for user: {data.user_id}")
#         print(f"Number of skills offered: {len(data.skill_set)}")
        
#         response = upload_pinecone(data.dict(), "offer")
        
#         return {
#             "status": "success",
#             "type": "offer",
#             "user_id": data.user_id,
#             "uploaded_skills": len(data.skill_set),
#             "pinecone_response": str(response)
#         }

#     except Exception as e:
#         print("❌ Exception during /embed-offer request:")
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Pinecone upload failed: {str(e)}"
#         )



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)