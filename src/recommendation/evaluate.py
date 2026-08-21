# after finishing this file run python3 src/recommendation/evaluate.py

import json
import re
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))  # add src/ to the path
from recommendation.similarity import load_data, load_model, search

QUERIES_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "queries.json"


def get_titles(results_df):
    """Extract just the title strings from a search() results dataframe, in rank order."""
    return results_df["soup"].str.extract(r"Title: (.+)")[0].tolist()


def precision_at_k(retrieved_titles, relevant_titles, k):
    top_k = retrieved_titles[:k]
    hits = len(set(top_k) & set(relevant_titles))
    return hits / k


def recall_at_k(retrieved_titles, relevant_titles, k):
    if not relevant_titles:
        return None  # can't compute recall with no ground truth — skip, don't count as 0
    top_k = retrieved_titles[:k]
    hits = len(set(top_k) & set(relevant_titles))
    return hits / len(relevant_titles)


def run_eval(k=5):
    df, embeddings = load_data()
    model = load_model()

    with open(QUERIES_PATH) as f:
        queries = json.load(f)

    precisions, recalls = [], []
    skipped = 0

    for item in queries:
        if not item["relevant"]:
            skipped += 1
            continue  # skip queries with no ground truth — can't score them meaningfully

        results = search(item["query"], df, embeddings, model, k=k)
        retrieved_titles = get_titles(results)

        p = precision_at_k(retrieved_titles, item["relevant"], k)
        r = recall_at_k(retrieved_titles, item["relevant"], k)

        precisions.append(p)
        recalls.append(r)

        print(f"{item['query'][:50]:50s} P@{k}={p:.2f}  R@{k}={r:.2f}")

    print(f"\nScored {len(precisions)} queries ({skipped} skipped — no ground truth)")
    print(f"Mean Precision@{k}: {sum(precisions)/len(precisions):.3f}")
    print(f"Mean Recall@{k}:    {sum(recalls)/len(recalls):.3f}")

    return precisions, recalls


if __name__ == "__main__":
    run_eval(k=5)