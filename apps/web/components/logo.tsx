// Astraya wordmark — minimalist star-meridian glyph + bilingual name.
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="astGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8C37A" />
            <stop offset="60%" stopColor="#9D6FD9" />
            <stop offset="100%" stopColor="#4F9DDE" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" stroke="url(#astGrad)" strokeWidth="1.5" fill="none" />
        <path
          d="M32 8 L38 26 L56 32 L38 38 L32 56 L26 38 L8 32 L26 26 Z"
          fill="url(#astGrad)"
          opacity="0.9"
        />
        <circle cx="32" cy="32" r="2.5" fill="#F7F5ED" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-base tracking-[0.3em] text-pearl-100">ASTRAYA</span>
        <span className="font-serif text-[10px] tracking-[0.5em] text-starlight-500 mt-1">星 脉</span>
      </span>
    </span>
  );
}
