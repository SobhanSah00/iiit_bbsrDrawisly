from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import DescriptionModel, Prompt, Need
from utils import ( 
    get_emb, 
    push_db_need,
    push_db_offer,
    search_offer_db,
    retrive_offer_emb,
    get_need_emb,
    get_similarity,
    run_ambiguity_checker,
)

load_dotenv()

app = FastAPI(
    title="Skill Embedding Service",
    description="API to embed user skill descriptions and push to Pinecone.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def status():
    return {'message': 'ALIVE'}


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
        combined_text = ""
    return {'message' : 'sent to need db', "response" : response}


    
@app.post('/compatible-users')
def find_compatible_users(prompt: Prompt):
        prompt_dict = prompt.dict()
        query = prompt_dict['query']
        ambiguity_check_reponse = run_ambiguity_checker(query)
        if ambiguity_check_reponse['ambiguous'] == "false":
            return {'message' : 'Ambigous',
                    'suggestion' : ambiguity_check_reponse["suggestions"]}

        user_profile = prompt_dict['user_profile']
        user_id = user_profile['user_id']
        
        prompt_emb = get_emb(query)
        top_k_matches = search_offer_db(prompt_emb)
        matches = top_k_matches['matches']

        user_offer_emb_list, user_offerings_str = retrive_offer_emb(user_id) # What user is offering
        
        if not user_offer_emb_list:
            emb = get_emb(query)
            response = push_db_need(user_id, emb, query)
            return {"message" : 'No User Found, pushed to fleeting'}
    
        seen_users = set()
        user_list = []
        
        for entry in matches:
            probable_compatible_u_id = entry['metadata']['user_id']
            # print(entry)
            matched_user_offering = entry['metadata']['combined_text']
            # print(entry)
            need_to_off_score = entry['score']
            
            if probable_compatible_u_id in seen_users:
                continue
            seen_users.add(probable_compatible_u_id)

            if probable_compatible_u_id == user_id:
                continue
            
            need_emb_of_probable, need_str = get_need_emb(probable_compatible_u_id)
            if need_emb_of_probable is None:
                continue
            
            best_score, best_idx = get_similarity(user_offer_emb_list, need_emb_of_probable)
            print("EXECY")
            if best_score > 0.5:
                    print(f"\nCompatible Match Found")
                    print(f"  User [{probable_compatible_u_id}] is searching for → {need_str}")
                    print(f"  and offers → {matched_user_offering}\n")
                    print(f"  Our User [{user_id}] is searching for → {query}")
                    print(f"  and offers → {user_offerings_str[best_idx]}\n")

                    user_list.append([probable_compatible_u_id, need_str])

        return {'message' : user_list}