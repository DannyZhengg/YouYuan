import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

def load_model():
    return SentenceTransformer(MODEL_NAME)

def embed_dramas(df, model):
    soups = df["soup"].tolist()
    embeddings = model.encode(soups, show_progress_bar=True, convert_to_numpy=True)
    return embeddings

def embed_query(query, model):
    return model.encode([query], convert_to_numpy=True)[0]

def run():
    df = pd.read_pickle("data/processed/clean_dramas.pkl")
    model = load_model()

    embeddings = embed_dramas(df, model)
    print(f"Generated embeddings: shape {embeddings.shape}")

    np.save("data/processed/embeddings.npy", embeddings)
    # save the ids alongside, in the same row order, to map embeddings back to dramas later
    df["id"].to_pickle("data/processed/embedding_ids.pkl")

    print("Saved embeddings.npy and embedding_ids.pkl")

if __name__ == "__main__":
    run()