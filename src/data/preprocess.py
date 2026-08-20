# src/data/preprocess.py
import pandas as pd

def load_raw(paths={
    "drama": "data/raw/dramas.jsonl",
    "movie": "data/raw/movies.jsonl",
    "tvshow": "data/raw/tvshows.jsonl",
    "special": "data/raw/specials.jsonl",
}):
    dfs = []
    for content_type, path in paths.items():
        df = pd.read_json(path, lines=True)
        df["content_type"] = content_type
        dfs.append(df)
    return pd.concat(dfs, ignore_index=True)


def extract_soup(row):
    title = row["titles"].get("english") or row["titles"].get("native")
    genres = ", ".join(g["name"] for g in row["genres"])
    tags = ", ".join(t["name"] for t in row["tags"])
    main_cast = ", ".join(c["name"] for c in row["cast"].get("main", []))

    directors_field = row.get("directors")
    directors = ", ".join(d["name"] for d in directors_field) if isinstance(directors_field, list) else ""

    year = row["date"].year if pd.notnull(row["date"]) else "Unknown"

    return f"""Title: {title}
Type: {row["content_type"]}
Genres: {genres}
Tags: {tags}
Cast: {main_cast}
Director: {directors}
Year: {year}
Description: {row["synopsis"]}"""


def clean(df):
    df = df[df["country"] == "China"].copy()
    df = df.dropna(subset=["synopsis"])

    df = df.drop_duplicates(subset="id")  # only catches true duplicate rows, not title collisions

    df["soup"] = df.apply(extract_soup, axis=1)
    return df


def run():
    df = load_raw()
    print(f"Loaded {len(df)} total rows across all 4 files")
    print(df["content_type"].value_counts())

    df = clean(df)
    print(f"After cleaning + China filter: {len(df)} rows")

    df.to_pickle("data/processed/clean_dramas.pkl")
    print("Saved to data/processed/clean_dramas.pkl")


if __name__ == "__main__":
    run()