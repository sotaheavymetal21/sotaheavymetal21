/**
 * Renders the README hero banner.
 *
 * Hand-built rather than pulled from capsule-render: the hosted header services
 * are the single most recognisable "profile README template" tell, and a banner
 * committed to the repository can never 503.
 *
 * The chromatic-aberration wordmark is three copies of the same string — a cyan
 * copy nudged left, a magenta copy nudged right, and the solid text on top. All
 * three are painted at full opacity so a static frame still reads correctly.
 */

import { MONO_STACK, THEMES } from './palette.mjs';

const WIDTH = 860;
const HEIGHT = 232;
const PAD = 18;
const BRACKET = 18;
const GRID_STEP = 20;

/** @typedef {import('./palette.mjs').Palette} Palette */

/**
 * @typedef {object} HeroContent
 * @property {string} wordmark
 * @property {string} role
 * @property {string} affiliation
 */

/** @param {string} value */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {Palette} theme */
function renderGrid(theme) {
  const lines = [];
  for (let x = GRID_STEP; x < WIDTH; x += GRID_STEP) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}"/>`);
  }
  for (let y = GRID_STEP; y < HEIGHT; y += GRID_STEP) {
    lines.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}"/>`);
  }
  return `<g stroke="${theme.grid}" stroke-width="1" opacity="0.45">${lines.join('')}</g>`;
}

function renderFrame(theme) {
  const right = WIDTH - PAD;
  const bottom = HEIGHT - PAD;
  const path = [
    `M${PAD} ${PAD + BRACKET} L${PAD} ${PAD} L${PAD + BRACKET} ${PAD}`,
    `M${right - BRACKET} ${PAD} L${right} ${PAD} L${right} ${PAD + BRACKET}`,
    `M${right} ${bottom - BRACKET} L${right} ${bottom} L${right - BRACKET} ${bottom}`,
    `M${PAD + BRACKET} ${bottom} L${PAD} ${bottom} L${PAD} ${bottom - BRACKET}`,
  ].join(' ');
  return `<path d="${path}" fill="none" stroke="${theme.cyan}" stroke-width="1.6" stroke-linecap="square" opacity="0.75"/>`;
}

/** @param {Palette} theme */
function renderStyles(theme) {
  return `
  <style>
    text { font-family: ${MONO_STACK}; text-anchor: middle; }
    .mark  { font-size: 43px; font-weight: 700; letter-spacing: 4.5px; }
    .role  { font-size: 13.5px; font-weight: 700; letter-spacing: 6px; }
    .meta  { font-size: 10px; letter-spacing: 2.4px; }
    .tag   { font-size: 9.5px; font-weight: 700; letter-spacing: 2.6px; text-anchor: start; }

    .ghost-cyan    { animation: driftLeft  6s steps(1, end) infinite; }
    .ghost-magenta { animation: driftRight 6s steps(1, end) infinite; }
    @keyframes driftLeft {
      0%, 88%, 100% { transform: translateX(-2px); }
      90%           { transform: translateX(-7px); }
      92%           { transform: translateX(-1px); }
      95%           { transform: translateX(-5px); }
    }
    @keyframes driftRight {
      0%, 88%, 100% { transform: translateX(2px); }
      90%           { transform: translateX(7px); }
      92%           { transform: translateX(1px); }
      95%           { transform: translateX(5px); }
    }

    .scan { animation: sweep 6s cubic-bezier(.45,0,.55,1) infinite; }
    @keyframes sweep {
      0%        { transform: translateX(-200px); }
      60%, 100% { transform: translateX(${WIDTH + 80}px); }
    }

    .blink { animation: blink 1.15s steps(1, end) infinite; }
    @keyframes blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0.05; } }

    @media (prefers-reduced-motion: reduce) {
      .ghost-cyan, .ghost-magenta, .scan, .blink { animation: none; }
      .scan { opacity: 0; }
    }
  </style>
  <defs>
    <radialGradient id="halo" cx="50%" cy="42%" r="62%">
      <stop offset="0%"   stop-color="${theme.cyan}" stop-opacity="${theme.glow * 0.32}"/>
      <stop offset="55%"  stop-color="${theme.magenta}" stop-opacity="${theme.glow * 0.14}"/>
      <stop offset="100%" stop-color="${theme.bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${theme.cyan}"/>
      <stop offset="50%"  stop-color="${theme.magenta}"/>
      <stop offset="100%" stop-color="${theme.orange}"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${theme.cyan}" stop-opacity="0"/>
      <stop offset="50%"  stop-color="${theme.cyan}" stop-opacity="${theme.glow * 0.7}"/>
      <stop offset="100%" stop-color="${theme.cyan}" stop-opacity="0"/>
    </linearGradient>
    <filter id="hero-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.2" result="blur"/>
      <feComponentTransfer in="blur" result="soft">
        <feFuncA type="linear" slope="${theme.glow}"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="soft"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`;
}

/**
 * @param {HeroContent} content
 * @param {'dark' | 'light'} variant
 * @returns {string} standalone SVG document
 */
export function renderHero(content, variant) {
  const theme = THEMES[variant];
  if (!theme) throw new Error(`Unknown hero variant: ${variant}`);

  const center = WIDTH / 2;
  const wordmark = escapeXml(content.wordmark);
  const markY = 108;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeXml(content.wordmark)} — ${escapeXml(content.role)}">
  <title>${escapeXml(content.wordmark)} — ${escapeXml(content.role)}</title>
${renderStyles(theme)}
  <rect width="${WIDTH}" height="${HEIGHT}" rx="6" fill="${theme.bg}"/>
  ${renderGrid(theme)}
  <rect width="${WIDTH}" height="${HEIGHT}" rx="6" fill="url(#halo)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="6" fill="none" stroke="${theme.border}" stroke-width="1"/>
  ${renderFrame(theme)}

  <g>
    <rect x="${PAD + 14}" y="${PAD + 12}" width="3" height="11" fill="${theme.green}" class="blink"/>
    <text x="${PAD + 24}" y="${PAD + 21}" class="tag" fill="${theme.muted}">STATUS // ONLINE</text>
  </g>

  <g>
    <text class="mark ghost-cyan"    x="${center}" y="${markY}" fill="${theme.cyan}"    opacity="0.85">${wordmark}</text>
    <text class="mark ghost-magenta" x="${center}" y="${markY}" fill="${theme.magenta}" opacity="0.85">${wordmark}</text>
    <text class="mark"               x="${center}" y="${markY}" fill="${theme.text}" filter="url(#hero-glow)">${wordmark}</text>
  </g>

  <rect x="${center - 190}" y="${markY + 22}" width="380" height="1" fill="url(#beam)"/>

  <text class="role" x="${center}" y="${markY + 50}" fill="${theme.cyan}" filter="url(#hero-glow)">${escapeXml(content.role)}</text>
  <text class="meta" x="${center}" y="${markY + 76}" fill="${theme.muted}">${escapeXml(content.affiliation)}</text>

  <rect x="${PAD}" y="${HEIGHT - 10}" width="${WIDTH - PAD * 2}" height="2" rx="1" fill="url(#rule)" opacity="0.9"/>

  <g clip-path="inset(0 round 6px)">
    <rect class="scan" x="0" y="0" width="180" height="${HEIGHT}" fill="url(#beam)"/>
  </g>
</svg>
`;
}

export const HERO_DIMENSIONS = Object.freeze({ width: WIDTH, height: HEIGHT });
