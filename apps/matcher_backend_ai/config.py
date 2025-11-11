import os 
from dotenv import load_dotenv
from google import genai
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer


load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
MODEL_NAME = "gemini-2.5-flash"
client = genai.Client(api_key = GEMINI_API_KEY)

EMBEDDING_MODEL = SentenceTransformer("BAAI/bge-base-en-v1.5")

INDEX_NAME = "iiit-backend-embed-store"
NEED_INDEX_NAME = "need-v2"
OFFER_INDEX_NAME = "offer-v1"
INDEX_HOST = "https://iiit-backend-embed-store-xkdz6fe.svc.aped-4627-b74a.pinecone.io"

PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
pc = Pinecone(api_key=PINECONE_API_KEY)
