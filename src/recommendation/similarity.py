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


if __name__ == "__main__":
    df, embeddings = load_data()
    model = load_model()

    query = "historical romance with political intrigue and a strong female lead"
    results = search(query, df, embeddings, model, k=10)

    for _, row in results.iterrows():
        title_line = row["soup"].split("\n")[0]
        print(f"{title_line}  —  {row['similarity']:.3f}")