// Static deterministic starfield — avoids hydration mismatch and works server-side.
import { cn } from "@/lib/cn";

const STARS = Array.from({ length: 80 }).map((_, i) => {
  // Pseudo-random but stable positions (seeded by index)
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  const fx = seed - Math.floor(seed);
  const gy = Math.sin((i + 1) * 78.233) * 43758.5453;
  const fy = gy - Math.floor(gy);
  const sizeSeed = Math.sin((i + 2) * 17.19) * 43758.5453;
  const sz = 0.6 + (sizeSeed - Math.floor(sizeSeed)) * 1.8;
  const delay = (fx * 3).toFixed(2);
  return { left: `${(fx * 100).toFixed(2)}%`, top: `${(fy * 100).toFixed(2)}%`, size: sz.toFixed(2), delay };
});

export function Starfield({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-pearl-100 animate-twinkle"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            boxShadow: "0 0 4px rgba(247,245,237,0.7)",
          }}
        />
      ))}
    </div>
  );
}
