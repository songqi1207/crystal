/**
 * Deterministic SVG placeholder generator for product / master art.
 * Returns a data URI so we can render visuals without shipping binary assets.
 */

const CRYSTAL_GRADIENTS: Record<string, [string, string, string]> = {
  "amethyst-geode-brazil": ["#6B3FB3", "#9D6FD9", "#D2B8F0"],
  "rose-quartz-sphere": ["#D88AA0", "#F1B7C6", "#FBDFE6"],
  "citrine-tower-uruguay": ["#C78521", "#E8B257", "#F6D78A"],
  "black-obsidian-pendant": ["#0A0E27", "#1F1F33", "#4A3E6B"],
  "labradorite-palmstone": ["#1D4E5E", "#4FA3B8", "#C3E5DF"],
  "clear-quartz-cluster": ["#56678A", "#AEC6E4", "#F5F8FF"],
};

function gradientFor(slug: string): [string, string, string] {
  return CRYSTAL_GRADIENTS[slug] ?? ["#3A447A", "#9D6FD9", "#E8C37A"];
}

export function crystalSvgDataUri(slug: string, name = ""): string {
  const [a, b, c] = gradientFor(slug);
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'>
      <defs>
        <radialGradient id='g' cx='50%' cy='45%' r='65%'>
          <stop offset='0%' stop-color='${c}' stop-opacity='0.95'/>
          <stop offset='55%' stop-color='${b}' stop-opacity='0.85'/>
          <stop offset='100%' stop-color='${a}' stop-opacity='1'/>
        </radialGradient>
        <linearGradient id='shine' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#ffffff' stop-opacity='0.45'/>
          <stop offset='60%' stop-color='#ffffff' stop-opacity='0'/>
        </linearGradient>
      </defs>
      <rect width='600' height='600' fill='#05071A'/>
      <circle cx='80' cy='90' r='1.6' fill='#E8C37A' opacity='0.9'/>
      <circle cx='520' cy='140' r='1.2' fill='#C3E5DF' opacity='0.8'/>
      <circle cx='470' cy='480' r='1.8' fill='#D2B8F0' opacity='0.7'/>
      <circle cx='120' cy='460' r='1.4' fill='#F3D98E' opacity='0.7'/>
      <g transform='translate(300 310)'>
        <polygon points='0,-180 150,-40 110,160 -110,160 -150,-40'
                 fill='url(#g)' stroke='rgba(255,255,255,0.35)' stroke-width='1.5'/>
        <polygon points='0,-180 0,160 -150,-40' fill='url(#shine)' opacity='0.6'/>
        <polygon points='0,-180 110,160 150,-40' fill='#ffffff' opacity='0.08'/>
      </g>
      <text x='50%' y='570' text-anchor='middle'
            font-family='serif' font-size='22' fill='#A8A598'
            letter-spacing='6'>${escapeXml(name)}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export function masterSvgDataUri(seed: string, label: string): string {
  const hue = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
      <defs>
        <radialGradient id='halo' cx='50%' cy='45%' r='60%'>
          <stop offset='0%' stop-color='hsl(${hue},70%,78%)'/>
          <stop offset='70%' stop-color='hsl(${(hue + 40) % 360},55%,38%)'/>
          <stop offset='100%' stop-color='#05071A'/>
        </radialGradient>
      </defs>
      <rect width='400' height='400' fill='#05071A'/>
      <circle cx='200' cy='200' r='180' fill='url(#halo)'/>
      <circle cx='200' cy='200' r='126' fill='none'
              stroke='rgba(232,195,122,0.55)' stroke-dasharray='2 6'/>
      <text x='50%' y='52%' text-anchor='middle'
            font-family='serif' font-size='110'
            fill='#F7F5ED' opacity='0.9'>${escapeXml(label.slice(0, 1))}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}
