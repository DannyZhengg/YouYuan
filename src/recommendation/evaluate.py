import json
import sys
import time
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from recommendation.similarity import load_data, load_model, search, hybrid_search  # ADD hybrid_search import
from recommendation.llm import expand_query, extract_preferences  # ADD extract_preferences import

QUERIES_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "queries.json"


def get_titles(results_df):
    return results_df["soup"].str.extract(r"Title: (.+)")[0].tolist()


def precision_at_k(retrieved_titles, relevant_titles, k):
    top_k = retrieved_titles[:k]
    hits = len(set(top_k) & set(relevant_titles))
    return hits / k


def recall_at_k(retrieved_titles, relevant_titles, k):
    if not relevant_titles:
        return None
    top_k = retrieved_titles[:k]
    hits = len(set(top_k) & set(relevant_titles))
    return hits / len(relevant_titles)


# NEW: mode is now a string instead of a boolean, since there are 3 options now
def run_eval(k=5, mode="baseline"):
    print(f"\n=== Running Evaluation | Mode: {mode} | K={k} ===\n")

    df, embeddings = load_data()
    model = load_model()

    with open(QUERIES_PATH) as f:
        queries = json.load(f)

    precisions, recalls = [], []
    skipped = 0

    for item in queries:
        if not item["relevant"]:
            skipped += 1
            continue

        raw_query = item["query"]

        # NEW: branch on mode instead of a single use_expansion flag
        if mode == "expansion":
            search_query = expand_query(raw_query)
            time.sleep(0.5)
            results = search(search_query, df, embeddings, model, k=k)

        elif mode == "hybrid":
            prefs = extract_preferences(raw_query)
            time.sleep(0.5)
            results = hybrid_search(raw_query, df, embeddings, model, prefs, k=k)

        else:  # baseline
            results = search(raw_query, df, embeddings, model, k=k)

        retrieved_titles = get_titles(results)

        p = precision_at_k(retrieved_titles, item["relevant"], k)
        r = recall_at_k(retrieved_titles, item["relevant"], k)

        precisions.append(p)
        recalls.append(r)

        print(f"{raw_query[:45]:45s} P@{k}={p:.2f}  R@{k}={r:.2f}")

    mean_p = sum(precisions) / len(precisions) if precisions else 0.0
    mean_r = sum(recalls) / len(recalls) if recalls else 0.0

    print(f"\nScored {len(precisions)} queries ({skipped} skipped)")
    print(f"[{mode}] Mean Precision@{k}: {mean_p:.3f}")
    print(f"[{mode}] Mean Recall@{k}:    {mean_r:.3f}")

    return mean_p, mean_r


if __name__ == "__main__":
    base_p, base_r = run_eval(k=5, mode="baseline")
    exp_p, exp_r = run_eval(k=5, mode="expansion")
    hyb_p, hyb_r = run_eval(k=5, mode="hybrid")
    
    print("\n" + "=" * 50)
    print("ABLATION SUMMARY")
    print("=" * 50)
    print(f"Baseline           -> P@5: {base_p:.3f} | R@5: {base_r:.3f}")
    print(f"+ Expansion (bad)  -> P@5: {exp_p:.3f} | R@5: {exp_r:.3f}")
    print(f"+ Extraction/boost -> P@5: {hyb_p:.3f} | R@5: {hyb_r:.3f}")