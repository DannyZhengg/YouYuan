import sys
from pathlib import Path
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommendation.similarity import load_data, load_model, search, hybrid_search
from recommendation.llm import extract_preferences

app = FastAPI(title="YouYuan API")

origins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
    id: str
    title: str
    genre: str
    type: str
    year: int | None
    cover: str | None
    similarity: float
    note: str
    tags: list[str]


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


def row_to_result(row) -> SearchResult:
    soup_lines = row["soup"].split("\n")
    title = soup_lines[0].replace("Title: ", "")

    genres_list = [g["name"] for g in row["genres"]] if isinstance(row["genres"], list) else []
    tags_list = [t["name"] for t in row["tags"]] if isinstance(row["tags"], list) else []
    genre = genres_list[0] if genres_list else "Drama"

    year = row["date"].year if pd.notnull(row.get("date")) else None
    synopsis = row["soup"].split("Description: ")[-1]
    note = synopsis[:120] + ("…" if len(synopsis) > 120 else "")

    return SearchResult(
        id=str(row["id"]),
        title=title,
        genre=genre,
        type=row["content_type"],
        year=year,
        cover=row.get("cover") if pd.notnull(row.get("cover")) else None,
        similarity=round(float(row.get("similarity", row.get("boosted_score", 0))), 3),
        note=note,
        tags=tags_list[:5],
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