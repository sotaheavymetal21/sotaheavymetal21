/**
 * Renders the "telemetry" card — the neon stat panel embedded in the README.
 *
 * Self-generated on purpose: the popular hosted stat-card services rate-limit
 * (github-readme-stats returns 503 at the time of writing), so the asset is
 * built here and committed to the repository instead.
 *
 * Constraints of SVG rendered inside an `<img>` on GitHub:
 *   - no scripts, no external resources, no webfonts (system fonts only)
 *   - CSS animations and SVG filters are supported
 */

import { MONO_STACK, THEMES } from './palette.mjs';

const WIDTH = 860;
const HEIGHT = 208;
const PAD = 16;
const GAP = 14;
const PANEL_COUNT = 4;
const PANEL_W = (WIDTH - PAD * 2 - GAP * (PANEL_COUNT - 1)) / PANEL_COUNT;
const PANEL_Y = 58;
const PANEL_H = 112;
const GRID_STEP = 20;
const BRACKET = 12;

/** @typedef {import('./palette.mjs').Palette} Palette */

/**
 * @typedef {object} TelemetryStats
 * @property {number} contributions
 * @property {number} commits
 * @property {number} articles
 * @property {number} certifications
 * @property {number} privateContributions
 * @property {string} syncedAt ISO date (YYYY-MM-DD)
 */

/** @param {string} value */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {number} value */
function formatNumber(value) {
  return Number(value).toLocaleString('en-US');
}

/**
 * @param {TelemetryStats} stats
 * @param {Palette} theme
 */
function buildPanels(stats, theme) {
  return [
    {
      label: 'CONTRIBUTIONS',
      value: formatNumber(stats.contributions),
      caption: 'last 12 months',
      accent: theme.cyan,
    },
    {
      label: 'COMMITS',
      value: formatNumber(stats.commits),
      accent: theme.magenta,
      caption: `${formatNumber(stats.privateContributions)} private`,
    },
    {
      label: 'ARTICLES',
      value: formatNumber(stats.articles),
      caption: 'published on Qiita',
      accent: theme.green,
    },
    {
      label: 'CERTIFICATIONS',
      value: formatNumber(stats.certifications),
      caption: 'AWS x4 / IPA x3',
      accent: theme.orange,
    },
  ];
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
  return `<g stroke="${theme.grid}" stroke-width="1" opacity="0.5">${lines.join('')}</g>`;
}

/**
 * Corner brackets give each panel its HUD framing without a full border box.
 *
 * @param {number} x @param {number} y @param {string} accent
 */
function renderBrackets(x, y, accent, delay) {
  const right = x + PANEL_W;
  const bottom = y + PANEL_H;
  const path = [
    `M${x} ${y + BRACKET} L${x} ${y} L${x + BRACKET} ${y}`,
    `M${right - BRACKET} ${y} L${right} ${y} L${right} ${y + BRACKET}`,
    `M${right} ${bottom - BRACKET} L${right} ${bottom} L${right - BRACKET} ${bottom}`,
    `M${x + BRACKET} ${bottom} L${x} ${bottom} L${x} ${bottom - BRACKET}`,
  ].join(' ');
  return `<path class="bracket" style="animation-delay:${delay}s" d="${path}" fill="none" stroke="${accent}" stroke-width="1.6" stroke-linecap="square"/>`;
}

/**
 * @param {ReturnType<typeof buildPanels>[number]} panel
 * @param {number} index
 * @param {Palette} theme
 */
function renderPanel(panel, index, theme) {
  const x = PAD + index * (PANEL_W + GAP);
  const centerX = x + PANEL_W / 2;
  // Offsetting each panel keeps the brackets and glitch out of lockstep.
  const delay = (0.85 * index).toFixed(2);

  return `
  <g class="panel">
    <rect x="${x}" y="${PANEL_Y}" width="${PANEL_W}" height="${PANEL_H}" rx="4"
          fill="${theme.panel}" stroke="${theme.border}" stroke-width="1"/>
    ${renderBrackets(x, PANEL_Y, panel.accent, delay)}
    <text x="${centerX}" y="${PANEL_Y + 26}" class="label" fill="${theme.muted}">${escapeXml(panel.label)}</text>
    <text x="${centerX}" y="${PANEL_Y + 70}" class="value" style="animation-delay:${delay}s" fill="${panel.accent}"
          filter="url(#neon-glow)">${escapeXml(panel.value)}</text>
    <text x="${centerX}" y="${PANEL_Y + 94}" class="caption" fill="${theme.muted}">${escapeXml(panel.caption)}</text>
  </g>`;
}

/** @param {Palette} theme */
function renderStyles(theme) {
  return `
  <style>
    text { font-family: ${MONO_STACK}; }
    .label   { font-size: 10px; font-weight: 700; letter-spacing: 2.2px; text-anchor: middle; }
    .value   { font-size: 34px; font-weight: 700; letter-spacing: -0.5px; text-anchor: middle; }
    .caption { font-size: 9.5px; letter-spacing: 0.8px; text-anchor: middle; }
    .head    { font-size: 11px; font-weight: 700; letter-spacing: 3px; }
    .meta    { font-size: 10px; letter-spacing: 1.4px; text-anchor: end; }

    /*
     * Content is never gated behind an animation: a static render (GitHub's
     * image cache, reduced-motion, an email digest) must still show every
     * number. Motion is layered on top of an already-complete frame.
     */
    .value { animation: flicker 7s steps(1, end) infinite; }
    @keyframes flicker {
      0%, 96%, 100% { opacity: 1; }
      97%           { opacity: .4; }
      98%           { opacity: 1; }
      99%           { opacity: .65; }
    }

    .bracket { animation: breathe 4.5s ease-in-out infinite; }
    @keyframes breathe {
      0%, 100% { opacity: .7; }
      50%      { opacity: 1; }
    }

    .scan { animation: sweep 5.5s cubic-bezier(.5,0,.5,1) infinite; }
    @keyframes sweep {
      0%        { transform: translateX(-160px); }
      55%, 100% { transform: translateX(${WIDTH + 60}px); }
    }

    .pulse { animation: pulse 3.2s ease-in-out infinite; }
    @keyframes pulse {
      0%, 100% { opacity: .35; }
      50%      { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .value, .scan, .pulse, .bracket { animation: none; }
      .scan { opacity: 0; }
    }
  </style>
  <defs>
    <filter id="neon-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.6" result="blur"/>
      <feComponentTransfer in="blur" result="soft">
        <feFuncA type="linear" slope="${theme.glow}"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="soft"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="scan-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${theme.scan}" stop-opacity="0"/>
      <stop offset="50%"  stop-color="${theme.scan}" stop-opacity="${theme.glow}"/>
      <stop offset="100%" stop-color="${theme.scan}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rule-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${theme.cyan}"/>
      <stop offset="50%"  stop-color="${theme.magenta}"/>
      <stop offset="100%" stop-color="${theme.orange}"/>
    </linearGradient>
  </defs>`;
}

/**
 * @param {TelemetryStats} stats
 * @param {'dark' | 'light'} variant
 * @returns {string} standalone SVG document
 */
export function renderTelemetry(stats, variant) {
  const theme = THEMES[variant];
  if (!theme) throw new Error(`Unknown telemetry variant: ${variant}`);

  const panels = buildPanels(stats, theme)
    .map((panel, index) => renderPanel(panel, index, theme))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="GitHub and Qiita activity telemetry">
  <title>telemetry — ${escapeXml(formatNumber(stats.contributions))} contributions, ${escapeXml(formatNumber(stats.commits))} commits, ${escapeXml(formatNumber(stats.articles))} articles</title>
${renderStyles(theme)}
  <rect width="${WIDTH}" height="${HEIGHT}" rx="6" fill="${theme.bg}"/>
  ${renderGrid(theme)}
  <rect width="${WIDTH}" height="${HEIGHT}" rx="6" fill="none" stroke="${theme.border}" stroke-width="1"/>

  <g>
    <rect x="${PAD}" y="24" width="3" height="14" fill="${theme.cyan}" class="pulse"/>
    <text x="${PAD + 12}" y="35" class="head" fill="${theme.text}">TELEMETRY</text>
    <text x="${WIDTH - PAD}" y="35" class="meta" fill="${theme.muted}">SYNCED ${escapeXml(stats.syncedAt)}</text>
  </g>

  ${panels}

  <rect x="${PAD}" y="${HEIGHT - 22}" width="${WIDTH - PAD * 2}" height="2" rx="1" fill="url(#rule-grad)" opacity="0.85"/>

  <g clip-path="inset(0 round 6px)">
    <rect class="scan" x="0" y="0" width="140" height="${HEIGHT}" fill="url(#scan-grad)"/>
  </g>
</svg>
`;
}

export const TELEMETRY_DIMENSIONS = Object.freeze({ width: WIDTH, height: HEIGHT });
