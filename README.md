# YouYuan 有缘
 
*A semantic recommendation engine for Chinese dramas, movies, TV shows, and specials — find your next story by meaning, mood, and emotion, not just genre tags.*
 
**[Live Demo →](#)** *(add link once deployed)*
 
---
 
## What this is
 
Discovering a Chinese drama that matches what you're actually in the mood for is hard — most platforms rely on generic genre tags with no way to describe what you want in your own words, and no explanation for why something was recommended.
 
YouYuan takes a free-text query — *"a slow-burn palace romance with a clever heroine"* — and returns relevant titles from a 3,492-title catalog, using transformer-based semantic embeddings rather than keyword matching, refined by an LLM layer that extracts your specific preferences and re-ranks results. Every recommendation traces back to a real title in the dataset — the LLM explains and re-ranks, it never invents.
 
The name comes from 有缘 (yǒuyuán) — "to have a fated connection."
 
## Architecture
 
```
User query
    │
    ▼
FastAPI backend
    │
    ▼
Sentence-Transformer embedding (all-mpnet-base-v2)
    │
    ▼
Cosine similarity vs. all title embeddings (brute-force, in-memory)
    │
    ▼
Top-K candidates
    │
    ▼
Groq LLM: JSON-mode preference extraction (genres/themes/exclusions)
    │
    ▼
Metadata-boosted re-ranking
    │
    ▼
JSON response → React frontend
```
 
**Design principle:** the LLM explains and re-ranks recommendations — it never generates them. Retrieval always originates from real embedding similarity over the actual dataset, which keeps the system grounded and avoids hallucinated picks. This also means there's no database — the dataset is static and read-only at request time, loaded once from flat files into memory at server startup.
 
## Stack
 
| Layer | Tool |
|---|---|
| Data | Python, pandas, NumPy |
| Embeddings | sentence-transformers (`all-mpnet-base-v2`) |
| Similarity search | scikit-learn cosine similarity (brute-force, in-memory — no vector DB needed at this scale) |
| LLM layer | Groq (`openai/gpt-oss-120b`), JSON-mode structured extraction |
| Backend | FastAPI |
| Frontend | React, TanStack Router/Start, Tailwind, GSAP |
| Ground-truth data source | MyDramaList community recommendation data, via an unofficial API |
 
## Dataset
 
Kaggle's [Asian Drama Dataset](https://www.kaggle.com/datasets/lakhindarpal/asian-drama-dataset) (dramas, movies, TV shows, and specials — 19,274 rows total), filtered to `country == China` and cleaned down to **3,492 titles**. Each title is represented as a combined text "soup" — title, genres, tags, cast, year, and synopsis — before being embedded.
 
## Evaluation
 
Rather than hand-labeling relevance from memory (which mostly measures the author's own taste and is highly tedious at scale), ground truth for a 30-query evaluation set was sourced from **MyDramaList's crowd-sourced "similar title" recommendation data**: for each query, a seed drama matching its genre/mood was chosen, and MDL's community-recommended titles for that seed — cross-referenced against this project's own dataset — became the relevance labels.
 
| System | Precision@5 | Recall@5 |
|---|---|---|
| Semantic baseline | 0.096 | 0.053 |
| LLM query expansion *(rejected)* | 0.056 | 0.025 |
| **LLM preference extraction + metadata re-ranking** | **0.120** | **0.065** |
 
*Recall@5 is mechanically capped well below 1.0 for queries with large (20-40 title) ground-truth sets, since only 5 results are compared against a much larger relevant pool — this is a metric ceiling effect, not purely a retrieval-quality signal.*
 
### A negative result, kept rather than hidden
 
The first attempted improvement — an LLM rewriting short queries into richer descriptive text before embedding — measurably **hurt** precision. Across multiple prompt-engineering attempts (explicit format constraints, a one-shot example, `temperature=0`), the model reliably produced narrative prose (*"a brooding, rain-slick metropolis..."*) instead of corpus-matching keyword text, creating a style mismatch with the dataset's structured metadata that embeddings are sensitive to.
 
The fix that worked was a structurally different approach, not a better prompt: Groq's forced JSON mode to extract structured genre/theme keywords, used to boost/penalize the existing semantic search results by direct keyword match against the dataset's own metadata — never touching the embedding step at all. JSON-schema compliance proved far more reliable than free-text format instructions in every test.
 
## Known limitations
 
- Subjective, unlabeled query attributes (e.g. "handsome/pretty leads") aren't supported — the dataset has no signal for this, and it's a data-availability problem rather than a retrieval-quality one.
- The evaluation benchmark (30 queries, MDL-sourced) is smaller in scale than industry benchmarks by design — the goal was a defensible, bias-reduced methodology, not a comprehensive one.
- No personalization, watch history, or user accounts — deliberately out of scope (see below).
## Deliberately out of scope
 
Personalized profiles/watch history, multimodal (poster-image) embeddings, reranking/cross-encoder models, a persistence database (the dataset is static and read-only, so one was never needed), and competing with existing datasets' scale.
 
## Real bugs hit along the way
 
- **Silent data-integrity bug:** a pandas index/position mismatch after `dropna`/`drop_duplicates` caused positional embedding lookups to silently return the wrong row's vector — fixed with `reset_index(drop=True)` and verified via nearest-neighbor spot checks.
- **Third-party API ambiguity:** MyDramaList search sometimes resolved an ambiguous title (multiple unrelated shows sharing an exact name) to the wrong show — fixed via a manual disambiguation list, cross-checked against year/synopsis.
- **Deprecated model ID:** an AI-suggested Groq model name (`llama-3.3-70b-versatile`) had been deprecated days earlier — caught by verifying against current docs before running, not by trusting the suggestion.
## Running it locally
 
```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python src/data/preprocess.py
python src/embeddings/embed.py
uvicorn app.main:app --reload --port 8000
 
# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```
 
Requires a free [Groq API key](https://console.groq.com) in a `.env` file:
```
GROQ_API_KEY=your_key_here
```
 
## Project structure
 
```
YouYuan/
├── src/
│   ├── data/            # dataset loading, cleaning, MyDramaList eval integration
│   ├── embeddings/       # sentence-transformer embedding generation
│   └── recommendation/   # search, hybrid re-ranking, evaluation
├── app/                  # FastAPI backend
├── frontend/              # React + TanStack frontend
├── data/processed/       # cleaned dataset, embeddings, eval query set
└── DESIGN.md              # full design & methodology document
```
 
See `DESIGN.md` for the complete design rationale, including every architectural decision and why it was made.