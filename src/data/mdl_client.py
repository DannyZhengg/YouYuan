import requests

MDL_BASE = "https://my-drama-list-api-ten.vercel.app/api"

def search_title(title):
    """Search MDL for a title, returns raw API response."""
    resp = requests.get(f"{MDL_BASE}/search/q/{title}")
    resp.raise_for_status()
    return resp.json()

SLUG_OVERRIDES = {
    "The Bad Kids": "51571-cat-s-cradle",
    "The Double": "736749-di-jia-qian-jin",
    "The Rise of Phoenixes": "21032-the-rise-of-phoenixes",
    "Hidden Love": "729705-hidden-love",
    "The Long Night": "49485-the-long-night"
}

def get_slug(title, prefer_type="Chinese Drama"):
    if title in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[title]

    result = search_title(title)
    matches = result.get("results", [])
    if not matches:
        raise ValueError(f"No MDL search results for '{title}'")

    for m in matches:
        if m["title"].strip().lower() == title.strip().lower():
            return m["slug"]

    print(f"WARNING: no exact match for '{title}', using top result '{matches[0]['title']}'")
    return matches[0]["slug"]


def get_recommendations(slug):
    """Get MDL's community recommendations for a drama, by slug."""
    resp = requests.get(f"{MDL_BASE}/id/{slug}/recs")
    resp.raise_for_status()
    return resp.json()


def build_relevant_list(seed_title, df, min_votes=1):
    """
    Given a seed drama title, fetch MDL's recommended similar titles,
    keep only ones that exist in our own dataset and have enough votes,
    and return their titles as a ground-truth relevance list.
    """
    slug = get_slug(seed_title)
    recs = get_recommendations(slug)

    dataset_titles = set(df["soup"].str.extract(r"Title: (.+)")[0])

    relevant = []
    for r in recs.get("recommendations", []):
        title = r["title"]
        votes = int(r.get("votes", 0) or 0)
        if title in dataset_titles and votes >= min_votes:
            relevant.append(title)

    return relevant