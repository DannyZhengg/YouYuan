import type { Recommendation } from "@/lib/dramas";

export function PosterCard({ drama }: { drama: Recommendation }) {
  return (
    <article className="poster-frame group relative w-[220px] shrink-0 bg-ink md:w-[248px]">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={drama.cover}
          alt={`${drama.title} poster`}
          loading="lazy"
          width={672}
          height={992}
          className="size-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.05]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-deep via-ink-deep/10 to-transparent" />

        <span className="absolute left-3 top-3 border border-gold/30 bg-ink-deep/70 px-2 py-1 text-[0.6rem] tracking-[0.2em] text-gold opacity-0 backdrop-blur-sm transition-opacity duration-700 group-hover:opacity-100">
          {(drama.similarity * 100).toFixed(0)}% MATCH
        </span>

        <p className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-2 text-[0.72rem] leading-relaxed text-beige opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
          {drama.note}
        </p>
      </div>

      <div className="px-4 py-4">
        <h3 className="font-display text-[1.05rem] leading-snug text-ivory">{drama.title}</h3>
        <p className="mt-1 text-[0.72rem] tracking-[0.14em] text-beige/70">
          {drama.genre} · {drama.type}
        </p>
      </div>
    </article>
  );
}
