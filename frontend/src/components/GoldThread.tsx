import { useEffect, useRef, useState } from "react";

/**
 * A single, hand-authored strand of golden silk that runs the full length of
 * the page. The geometry is fixed — scrolling only reveals more of it via
 * stroke-dashoffset, never regenerates the curve.
 */
const THREAD_PATH = [
  // leaves the woman's hand in the hero
  "M 296 604",
  "C 460 566, 640 686, 830 742",
  // drifts past the search field out toward the mountains
  "C 1016 796, 1180 772, 1318 706",
  "C 1432 652, 1500 760, 1486 920",
  // falls slowly toward the recommendation gallery
  "C 1470 1280, 1300 1420, 1080 1500",
  "C 880 1574, 640 1596, 470 1690",
  // a long, shallow sweep beneath the posters
  "C 330 1770, 268 1930, 340 2080",
  "C 420 2246, 700 2300, 960 2320",
  // through the value section
  "C 1180 2338, 1330 2420, 1330 2560",
  "C 1330 2716, 1090 2800, 850 2836",
  // and down into the footer
  "C 640 2868, 470 2946, 470 3080",
  "C 470 3210, 620 3280, 780 3300",
].join(" ");

export function GoldThread() {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.body.scrollHeight - window.innerHeight;
        const raw = max > 0 ? window.scrollY / max : 0;
        // the thread is already partly drawn at rest, in the hero
        setProgress(Math.min(1, 0.22 + raw * 0.95));
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const offset = length * (1 - progress);

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full md:block"
      viewBox="0 0 1520 3400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.15" />
          <stop offset="18%" stopColor="#C9A96E" stopOpacity="0.85" />
          <stop offset="52%" stopColor="#C9A96E" stopOpacity="0.4" />
          <stop offset="78%" stopColor="#C9A96E" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.18" />
        </linearGradient>
        <filter id="silkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* soft halo beneath the strand */}
      <path
        d={THREAD_PATH}
        fill="none"
        stroke="#C9A96E"
        strokeOpacity="0.12"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        filter="url(#silkGlow)"
        strokeDasharray={length || undefined}
        strokeDashoffset={length ? offset : undefined}
        style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,0.61,0.36,1)" }}
      />

      {/* the strand itself */}
      <path
        ref={pathRef}
        d={THREAD_PATH}
        fill="none"
        stroke="url(#silk)"
        strokeWidth="1"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray={length || undefined}
        strokeDashoffset={length ? offset : undefined}
        style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,0.61,0.36,1)" }}
      />

      {/* three rare points of light along the strand */}
      {length > 0 &&
        [0.06, 0.44, 0.82].map((t) => {
          const point = pathRef.current?.getPointAtLength(length * t);
          if (!point) return null;
          const visible = progress > t;
          return (
            <circle
              key={t}
              cx={point.x}
              cy={point.y}
              r="2.4"
              fill="#C9A96E"
              opacity={visible ? 0.6 : 0}
              filter="url(#silkGlow)"
              style={{ transition: "opacity 1.6s ease" }}
            />
          );
        })}
    </svg>
  );
}
