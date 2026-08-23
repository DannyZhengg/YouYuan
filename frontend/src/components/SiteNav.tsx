interface SiteNavProps {
  onExplore: () => void;
  onAboutOpen: () => void;
}

const links = ["Home", "Explore", "About"] as const;

export function SiteNav({ onExplore, onAboutOpen }: SiteNavProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-7 md:px-12">
        <a href="/" className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-wide text-ivory">缘</span>
          <span className="text-[0.7rem] uppercase tracking-[0.42em] text-beige">YouYuan</span>
        </a>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map((link, i) => {
            const baseClass =
              i === 0
                ? "relative text-[0.82rem] tracking-[0.18em] text-gold transition-colors duration-700 after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:bg-gold/60 after:content-['']"
                : "text-[0.82rem] tracking-[0.18em] text-beige transition-colors duration-700 hover:text-ivory";

            if (link === "Home") {
              return (
                <li key={link}>
                  <a href="/" className={baseClass}>{link}</a>
                </li>
              );
            }
            if (link === "Explore") {
              return (
                <li key={link}>
                  <button type="button" onClick={onExplore} className={baseClass}>
                    {link}
                  </button>
                </li>
              );
            }
            // About
            return (
              <li key={link}>
                <button type="button" onClick={onAboutOpen} className={baseClass}>
                  {link}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}