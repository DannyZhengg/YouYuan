import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

EXPANSION_SYSTEM_PROMPT = """
You are converting a short drama search query into a metadata-style expansion,
matching the format of a drama database entry. Do NOT write narrative prose,
scene-setting, or story openings. Do NOT invent specific character names or
plot twists. Just list relevant genres, themes, and tropes as keywords/short phrases.

Example format:
Genres: Historical, Romance, Political Drama
Themes: court intrigue, forbidden romance, succession conflict, scheming officials
Setting: imperial palace, ancient China

Keep total output under 40 words. Only output the metadata lines, nothing else.
"""

EXTRACTION_SYSTEM_PROMPT = """
Extract structured preferences from a drama search query as JSON.
Return ONLY valid JSON, no other text, in this exact schema:

{
  "genres": ["list", "of", "genre", "keywords"],
  "themes": ["list", "of", "theme", "or", "trope", "keywords"],
  "exclude": ["list", "of", "genres", "or", "themes", "to", "avoid"]
}

Use short, lowercase keywords. If a field has nothing relevant, use an empty list.
"""

def expand_query(query: str, model: str = "openai/gpt-oss-120b") -> str:
    """
    Expands short, generic queries into richer semantic text for vector search.
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": EXPANSION_SYSTEM_PROMPT},
                {"role": "user", "content": "historical court drama with scheming officials"},
                {"role": "assistant", "content": "Genres: Historical, Political Drama\nThemes: court intrigue, scheming officials, power struggle, loyalty, betrayal\nSetting: imperial court, ancient China"},
                {"role": "user", "content": f"{query}"}
            ],
            temperature=0.0,
            max_tokens=60,
        )
        raw_content = response.choices[0].message.content
        if raw_content:
            expanded = raw_content.strip()
            return expanded if expanded else query
        return query
    
    except Exception as e:
        print(f"[LLM Warning] Query expansion failed: {e}. Falling back to raw query.")
        return query

def extract_preferences(query: str, model: str = "openai/gpt-oss-120b") -> dict:
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": query}
            ],
            temperature=0.0,
            max_tokens=500,
            response_format={"type": "json_object"},
        )
        raw_content = response.choices[0].message.content
        if raw_content:
            return json.loads(raw_content)
        
        return {"genres": [], "themes": [], "exclude": []}
    except Exception as e:
        print(f"[LLM Warning] Preference extraction failed: {e}")
        return {"genres": [], "themes": [], "exclude": []}