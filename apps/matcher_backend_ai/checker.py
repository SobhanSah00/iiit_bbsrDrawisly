from config import pc, NEED_INDEX_NAME

print(NEED_INDEX_NAME in pc.list_indexes().names())
