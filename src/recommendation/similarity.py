import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-mpnet-base-v2"
DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"

def load_data():
    df = pd.read_pickle(DATA_DIR / "clean_dramas.pkl")
    embeddings = np.load(DATA_DIR / "embeddings.npy")
    return df, embeddings

def load_model():
    return SentenceTransformer(MODEL_NAME)

def search(query, df, embeddings, model, k=10):
    query_vec = model.encode([query], convert_to_numpy=True)

    sims = cosine_similarity(query_vec, embeddings)[0]

    results = df.copy()
    results["similarity"] = sims
    results = results.sort_values("similarity", ascending=False)

    return results.head(k)[["soup", "similarity", "content_type"]]

def hybrid_search(query, df, embeddings, model, prefs, k=5):
    base_results = search(query, df, embeddings, model, k=20)  # wider pool to re-rank from

    def boost_score(row):
        score = row["similarity"]
        text = row["soup"].lower()
        for g in prefs.get("genres", []):
            if g.lower() in text:
                score += 0.05
        for t in prefs.get("themes", []):
            if t.lower() in text:
                score += 0.05
        for e in prefs.get("exclude", []):
            if e.lower() in text:
                score -= 0.1
        return score

    base_results["boosted_score"] = base_results.apply(boost_score, axis=1)
    return base_results.sort_values("boosted_score", ascending=False).head(k)

if __name__ == "__main__":
    df, embeddings = load_data()
    model = load_model()

    query = "historical romance with political intrigue and a strong female lead"
    results = search(query, df, embeddings, model, k=10)

    for _, row in results.iterrows():
        title_line = row["soup"].split("\n")[0]
        print(f"{title_line}  —  {row['similarity']:.3f}")