
from utils import upload_pinecone

upload_pinecone([("vec1", [0.9]*512)])




# import json
# import numpy as np
# from sentence_transformers import SentenceTransformer, util

# # Load model
# model = SentenceTransformer("BAAI/bge-base-en-v1.5")  # small & fast general-purpose embedding model

# # Load synthetic user data
# with open("synthetic_user_data.json", "r", encoding="utf-8") as f:
#     users = json.load(f)

# # Build corpus of texts (each user's combined skills)
# def user_to_text(user):
#     combined = []
#     for skill in user["skill_set"]:
#         desc = skill.get("description", "")
#         name = skill.get("skill_name", "")
#         focus = skill.get("focus_area", "")
#         level = skill.get("experience_level", "")
#         combined.append(f"{name} ({level}) focused on {focus}. {desc}")
#     return " ".join(combined)

# corpus_texts = [user_to_text(u) for u in users]
# corpus_embeddings = model.encode(corpus_texts, convert_to_tensor=True)

# # ---- Query ----
# query = "backend developer familiar with Docker and CI/CD pipelines"
# query_embedding = model.encode(query, convert_to_tensor=True)

# # ---- Compute similarities ----
# cosine_scores = util.cos_sim(query_embedding, corpus_embeddings)[0]

# # ---- Get top-k ----
# k = 5
# top_results = np.argpartition(-cosine_scores, range(k))[:k]

# print(f"Top {k} matching users for query: '{query}'\n")
# for idx in top_results:
#     print(f"User ID: {users[idx]['user_id']}")
#     print(f"Score: {cosine_scores[idx]:.4f}")
#     print(user_to_text(users[idx])[:200] + "...\n")
