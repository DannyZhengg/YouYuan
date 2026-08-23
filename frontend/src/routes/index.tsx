import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import heroWoman from "@/assets/hero-woman.jpg";
import inkLandscape from "@/assets/ink-landscape.jpg";
import { GoldThread } from "@/components/GoldThread";
import { PosterCard } from "@/components/PosterCard";
import { SiteNav } from "@/components/SiteNav";
import { useReveal } from "@/hooks/use-reveal";
import type { Recommendation } from "@/lib/dramas";

const API_BASE = import.meta.env["VITE_API_BASE"] ?? "http://localhost:8000";

const FALLBACK_TITLES = [
  "When I Fly Towards You",
  "Nirvana in Fire",
  "The Untamed",
  "Hidden Love",
  "Word of Honor",
  "Love Between Fairy and Devil",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YouYuan" },
      {
        name: "description",
        content:
          "A quiet, cinematic recommendation companion for Chinese dramas — discover stories by meaning, mood and emotion.",
      },
      { property: "og:title", content: "YouYuan — Find your next Chinese drama" },
      {
        property: "og:description",
        content:
          "Follow the thread through thousands of Chinese dramas, films and stories to the one that finds you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const values = [
  {
    title: "Semantic Vector Search",
    body: "Powered by machine learning embeddings that analyze full plot narratives and emotional depth.",
  },
  {
    title: "Beyond Genre Labels",
    body: "Search naturally using feelings or plot ideas instead of rigid category tags.",
  },
  {
    title: "Curated C-Drama Corpus",
    body: "Matches your query across thousands of Chinese dramas, films, and mini-series.",
  },
  {
    title: "Instant Similarity Matching",
    body: "Fast, real-time cosine similarity ranking powered by a FastAPI backend.",
  },
];

function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-md border border-jade/30 bg-ink-deep p-8 text-ivory shadow-2xl">
        <h2 className="font-display text-2xl text-gold">About YouYuan</h2>
        <p className="mt-4 text-xs leading-relaxed text-beige/80">
          YouYuan is a semantic vector search engine for Chinese dramas. Instead of relying on traditional keyword searches or genre tags, it constructs rich text representations from plot narratives and character tropes, projecting them into high-dimensional embedding space to deliver real-time cosine similarity recommendations via FastAPI.
        </p>
        <button
          onClick={onClose}
          type="button"
          className="mt-6 border border-gold/40 px-4 py-2 text-xs tracking-widest text-gold transition-colors hover:bg-gold/10"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("Nirvana in Fire");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);

  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplore() {
  setError(null);
  try {
    const res = await fetch(`${API_BASE}/api/explore`);
    if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
    const drama = await res.json();

    const title: string = drama.title || drama.name || drama.drama_title || "";
    if (!title) throw new Error("API returned invalid format (missing title)");

    setQuery(title);
    setSubmitted(title);
  } catch (err) {
    console.warn("Explore endpoint failed, falling back to local titles:", err);
    const fallback: string = FALLBACK_TITLES[Math.floor(Math.random() * FALLBACK_TITLES.length)] ?? "Nirvana in Fire";
    setQuery(fallback);
    setSubmitted(fallback);
  } finally {
    setTimeout(() => {
      document.getElementById("recommendations")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }
}

  useEffect(() => {
    if (!submitted) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/recommend?q=${encodeURIComponent(submitted)}&k=8`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          const adapted = (data.results ?? []).map((r: any) => ({
            id: r.id,
            title: r.title,
            chineseTitle: "",
            genre: r.genre,
            type: r.type,
            year: r.year ?? 0,
            cover: r.cover ?? "",
            mood: "",
            tags: r.tags ?? [],
            note: r.note,
            similarity: r.similarity,
          }));
          setResults(adapted);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [submitted]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setOffsetY(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const recRef = useReveal<HTMLDivElement>();
  const valuesRef = useReveal<HTMLDivElement>();
  const footerRef = useReveal<HTMLDivElement>();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-deep">
      <GoldThread />
      <SiteNav onExplore={handleExplore} onAboutOpen={() => setAboutOpen(true)} />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* ————————————————— HERO ————————————————— */}
      <section
        ref={heroRef}
        className="relative flex min-h-[860px] items-center overflow-hidden md:min-h-[100svh]"
      >
        {/* atmospheric ink landscape */}
        <img
          src={inkLandscape}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1088}
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-70"
          style={{ transform: `translate3d(0, ${offsetY * 0.12}px, 0) scale(1.06)` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_60%_40%,transparent_0%,#101515_78%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-ink-deep" />

        {/* the woman — an ink painting emerging from the dark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[78%] sm:w-[56%] lg:w-[46%]"
          style={{ transform: `translate3d(0, ${offsetY * -0.04}px, 0)` }}
        >
          <img
            src={heroWoman}
            alt="Ink painting of a woman in a flowing jade hanfu robe"
            width={1024}
            height={1536}
            className="ink-fade-left size-full object-cover object-[62%_18%] opacity-[0.9]"
          />
        </div>

        {/* keeps the copy legible where the painting sits beneath it */}
        <div className="pointer-events-none absolute inset-0 z-[6] bg-gradient-to-r from-ink-deep/70 via-ink-deep/45 to-ink-deep/10 md:hidden" />

        {/* vertical seal caption */}
        <span className="vertical-text absolute left-6 top-32 z-20 hidden text-[0.62rem] text-beige/40 lg:block">
          尋 你 的 下 一 個 故 事
        </span>

        <div className="relative z-20 mx-auto flex w-full max-w-[1400px] px-6 md:px-12">
          <div className="ml-auto w-full max-w-xl text-left md:mr-8 lg:mr-24">
            <h1 className="font-display text-[3.4rem] leading-[1.04] text-ivory sm:text-[4.4rem] lg:text-[5.2rem]">
              Find your
              <br />
              next story.
            </h1>

            <p className="mt-7 max-w-md text-[0.95rem] leading-[1.9] text-beige">
              A thread leads you through thousands of Chinese dramas, films and stories — follow
              it to the one that finds you.
            </p>

            {error && (
              <p className="mt-4 text-xs tracking-wide text-rose-400">
                Unable to reach recommendation service ({error}).
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(query);
                document.getElementById("recommendations")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group mt-6 flex items-center gap-3 border border-jade/40 bg-ink-deep/60 py-2 pl-6 pr-2 backdrop-blur-md transition-colors duration-700 focus-within:border-gold/70"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What kind of story are you looking for?"
                aria-label="Search dramas by mood, genre or title"
                className="w-full bg-transparent py-2.5 text-[0.9rem] text-ivory outline-none placeholder:text-beige/55"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex size-10 shrink-0 items-center justify-center bg-jade/80 text-ivory transition-colors duration-700 hover:bg-jade"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4.5 4.5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ———————————— RECOMMENDATIONS ———————————— */}
      <section id="recommendations" className="relative z-20 py-28 md:py-36">
        <div ref={recRef} className="reveal mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-display text-2xl text-ivory md:text-[1.9rem]">
              {submitted ? "Because you searched" : "Because you watched"}
            </h2>
            <span className="font-display text-2xl italic text-jade-light md:text-[1.9rem]">
              “{submitted || "The Untamed"}”
            </span>
          </div>
          <p className="mt-3 text-[0.78rem] tracking-[0.16em] text-beige/60">
            {loading ? "SEARCHING THE THREAD..." : `${results.length} STORIES ALONG THE SAME THREAD`}
          </p>

          <div className="mt-12 flex snap-x gap-6 overflow-x-auto pb-8 [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden">
            {results.map((drama) => (
              <div key={drama.id} className="snap-start">
                <PosterCard drama={drama} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ———————————————— VALUES ———————————————— */}
      <section className="relative z-20 border-y border-jade/15 py-28 md:py-36">
        <div
          ref={valuesRef}
          className="reveal mx-auto grid max-w-[1400px] gap-14 px-6 md:grid-cols-2 md:px-12 lg:grid-cols-4"
        >
          {values.map((value) => (
            <div key={value.title}>
              <span className="block h-px w-10 bg-gold/50" />
              <h3 className="mt-6 font-display text-[1.2rem] text-ivory">{value.title}</h3>
              <p className="mt-3 text-[0.85rem] leading-[1.85] text-beige/80">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ———————————————— FOOTER ———————————————— */}
      <footer id="footer" className="relative z-20 py-24 md:py-32">
        <div
          ref={footerRef}
          className="reveal mx-auto max-w-[1400px] px-6 text-center md:px-12"
        >
          <p className="font-display text-[1.7rem] leading-relaxed text-ivory md:text-[2.2rem]">
            Every story is a thread.
            <br />
            <span className="text-jade-light">Somewhere, one is waiting for you.</span>
          </p>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-[0.75rem] tracking-[0.2em] text-beige/60">
            <span className="font-display text-lg tracking-normal text-ivory">缘</span>
            <a
              href="https://github.com/DannyZhengg"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-700 hover:text-gold"
            >
              GITHUB
            </a>
            <a
              href="https://www.linkedin.com/in/danny-zheng-8953a1281"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-700 hover:text-gold"
            >
              LINKEDIN
            </a>
            <a
              href="mailto:dannyzheng429@gmail.com"
              className="transition-colors duration-700 hover:text-gold"
            >
              CONTACT
            </a>
          </div>

          <p className="mt-10 text-[0.7rem] tracking-[0.18em] text-beige/35">
            © {new Date().getFullYear()} YOUYUAN — 缘
          </p>
        </div>
      </footer>
    </div>
  );
}