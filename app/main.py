import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommendation.similarity import load_data, load_model, search, hybrid_search
from recommendation.llm import extract_preferences

app = FastAPI(title="YouYuan API")

# Allow your frontend (running on a different port/origin during local dev) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your actual frontend URL before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data + model ONCE at startup, not per-request — this is the whole point of
# not needing a database: everything lives in memory for the life of the server
print("Loading dataset and model...")
df, embeddings = load_data()
model = load_model()
print(f"Loaded {len(df)} titles.")


class SearchResult(BaseModel):
    title: str
    content_type: str
    similarity: float
    synopsis: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


def row_to_result(row) -> SearchResult:
    soup_lines = row["soup"].split("\n")
    title = soup_lines[0].replace("Title: ", "")
    synopsis = row["soup"].split("Description: ")[-1][:200]  # short preview
    return SearchResult(
        title=title,
        content_type=row["content_type"],
        similarity=round(float(row.get("similarity", row.get("boosted_score", 0))), 3),
        synopsis=synopsis,
    )


@app.get("/api/search", response_model=SearchResponse)
def api_search(q: str, k: int = 10):
    """Baseline semantic search — no LLM layer."""
    results = search(q, df, embeddings, model, k=k)
    return SearchResponse(
        query=q,
        results=[row_to_result(row) for _, row in results.iterrows()],
    )


@app.get("/api/recommend", response_model=SearchResponse)
def api_recommend(q: str, k: int = 5):
    """Full pipeline — LLM preference extraction + boosted re-ranking."""
    prefs = extract_preferences(q)
    results = hybrid_search(q, df, embeddings, model, prefs, k=k)
    return SearchResponse(
        query=q,
        results=[row_to_result(row) for _, row in results.iterrows()],
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "dataset_size": len(df)}