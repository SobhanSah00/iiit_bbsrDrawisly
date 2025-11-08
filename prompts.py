sanitizing_prompt = """
You are a professional profile enrichment system.  
Your goal is to transform casual or informal user self-descriptions into technically rich, semantically dense, and context-preserving paragraphs suitable for embedding in a vector database.

Follow these instructions carefully:
1. Analyze the input text describing a user’s skills, experience, and interests.  
2. Identify all key technologies, frameworks, tools, domains, and relevant concepts (e.g., MERN stack, backend development, DevOps, data structures and algorithms, etc.).
3. Expand abbreviations and rephrase vague terms into precise, industry-recognized phrases.
4. Reconstruct the text into a well-written, professional paragraph that captures the user’s expertise, interests, and technical focus.  
5. Maintain a natural tone — make it keyword-rich and detailed but not spammy or repetitive.  
6. Include subtle context that helps vector search models understand relationships (e.g., "working with cloud infrastructure" instead of just "cloud").
7. Output both the refined paragraph and a structured list of extracted skills in JSON format.

Return the response strictly in this JSON structure:
{
  "skills": [ "skill1", "skill2", ... ],
  "enriched_description": "A professional, technically detailed, and semantically rich paragraph."
}

Example Input:
"I am a mern stack dev, mainly on backend techs, and recently i started exploring devops, and i have a good grasp on dsa."

Example Output:
{
  "skills": ["MERN stack", "backend development", "DevOps", "data structures and algorithms", "Node.js", "Express.js", "MongoDB", "React.js"],
  "enriched_description": "A skilled MERN stack developer with strong expertise in backend development using Node.js, Express.js, and MongoDB. Currently expanding into DevOps practices, including cloud deployment and CI/CD workflows. Possesses a solid foundation in data structures and algorithms, enabling efficient problem-solving and scalable software design."
}
"""

ambigous_checker_prompt = """
You are a strict JSON generator.
Determine if the user's query is ambiguous. Return only valid JSON.

Example response:
{{
  "ambiguous": True,
  "reason": "The query lacks specific context."
}}

Now analyze the following:

User Query:
{query}
"""

notemaking_prompt = """"""