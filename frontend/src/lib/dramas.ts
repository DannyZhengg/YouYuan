import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import poster4 from "@/assets/poster-4.jpg";
import poster5 from "@/assets/poster-5.jpg";
import poster6 from "@/assets/poster-6.jpg";

export type Drama = {
  id: string;
  title: string;
  chineseTitle: string;
  genre: string;
  type: string;
  year: number;
  cover: string;
  mood: string;
  tags: string[];
  note: string;
};

export const dramas: Drama[] = [
  {
    id: "word-of-honor",
    title: "Word of Honor",
    chineseTitle: "山河令",
    genre: "Wuxia",
    type: "Friendship",
    year: 2021,
    cover: poster1,
    mood: "melancholy loyalty, jianghu wandering",
    tags: ["wuxia", "brotherhood", "swords", "tragic", "martial arts"],
    note: "Two weary swordsmen walk the jianghu until it becomes a home.",
  },
  {
    id: "love-like-the-galaxy",
    title: "Love Like the Galaxy",
    chineseTitle: "星汉灿烂",
    genre: "Romance",
    type: "Historical",
    year: 2022,
    cover: poster2,
    mood: "warm courtship, family politics",
    tags: ["romance", "historical", "court", "slow burn", "family"],
    note: "A clever daughter negotiates love on her own terms.",
  },
  {
    id: "the-long-ballad",
    title: "The Long Ballad",
    chineseTitle: "长歌行",
    genre: "Historical",
    type: "Adventure",
    year: 2021,
    cover: poster3,
    mood: "exile, frontier wind, revenge softened",
    tags: ["adventure", "war", "historical", "strategy", "revenge"],
    note: "A princess in exile rides the frontier and rewrites her fate.",
  },
  {
    id: "story-of-kunning-palace",
    title: "Story of Kunning Palace",
    chineseTitle: "宁安如梦",
    genre: "Romance",
    type: "Palace",
    year: 2023,
    cover: poster4,
    mood: "second chances, cold courtyards",
    tags: ["palace", "romance", "rebirth", "intrigue", "revenge"],
    note: "Given a second life, she chooses the man she once condemned.",
  },
  {
    id: "gone-with-the-rain",
    title: "Gone With the Rain",
    chineseTitle: "雨中相逢",
    genre: "Romance",
    type: "Melodrama",
    year: 2024,
    cover: poster5,
    mood: "snowfall, quiet devotion, grief",
    tags: ["melodrama", "romance", "tragic", "winter", "devotion"],
    note: "Two people keep meeting in the same falling snow.",
  },
  {
    id: "moonlit-immortal",
    title: "The Moonlit Immortal",
    chineseTitle: "月照仙途",
    genre: "Xianxia",
    type: "Fantasy",
    year: 2023,
    cover: poster6,
    mood: "ascension, loneliness above the clouds",
    tags: ["xianxia", "fantasy", "immortal", "epic", "destiny"],
    note: "An immortal counts the centuries from above the cloud sea.",
  },
];

export type Recommendation = Drama & { similarity: number };

/**
 * Lightweight local similarity ranking over title, genre, mood and tags.
 * Mirrors the shape returned by the recommendation endpoint.
 */
export function recommend(query: string, limit = 6): Recommendation[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return dramas.slice(0, limit).map((d, i) => ({ ...d, similarity: 0.93 - i * 0.04 }));
  }

  const terms = q.split(/\s+/).filter(Boolean);

  const scored = dramas.map((drama) => {
    const haystack = [
      drama.title,
      drama.chineseTitle,
      drama.genre,
      drama.type,
      drama.mood,
      drama.note,
      ...drama.tags,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (drama.title.toLowerCase().includes(term)) score += 0.45;
      if (drama.genre.toLowerCase().includes(term) || drama.type.toLowerCase().includes(term))
        score += 0.3;
      if (drama.tags.some((t) => t.includes(term) || term.includes(t))) score += 0.25;
      if (haystack.includes(term)) score += 0.15;
    }

    const similarity = Math.min(0.98, 0.42 + score / (terms.length * 1.2));
    return { ...drama, similarity };
  });

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
