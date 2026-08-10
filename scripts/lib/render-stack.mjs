/**
 * Renders the stack map — the layered technology diagram in the README.
 *
 * This started life as a Mermaid block. GitHub renders Mermaid in a sandboxed
 * viewscreen iframe that rejected the diagram ("Unable to render rich display")
 * even though mermaid 10.9 and 11 both parse it cleanly, so the version behind
 * that iframe cannot be relied on. Drawing it here removes the dependency and
 * lets the diagram share the palette with the rest of the page.
 */

import { MONO_STACK, THEMES } from './palette.mjs';

const WIDTH = 860;
const PAD = 16;
const GAP = 16;
const COLUMN_COUNT = 4;
const COLUMN_W = (WIDTH - PAD * 2 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
const COLUMNS_Y = 54;
const HEADER_H = 26;
const ITEM_H = 26;
const ITEM_GAP = 6;
const GRID_STEP = 20;

/** @typedef {import('./palette.mjs').Palette} Palette */
/** @typedef {{ title: string, accent: keyof Palette, items: string[] }} Column */

/** @param {string} value */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {Column[]} columns */
function computeHeight(columns) {
  const rows = Math.max(...columns.map((column) => column.items.length));
  return COLUMNS_Y + HEADER_H + 12 + rows * ITEM_H + (rows - 1) * ITEM_GAP + PAD + 6;
}

/** @param {Palette} theme @param {number} height */
function renderGrid(theme, height) {
  const lines = [];
  for (let x = GRID_STEP; x < WIDTH; x += GRID_STEP) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}"/>`);
  }
  for (let y = GRID_STEP; y < height; y += GRID_STEP) {
    lines.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}"/>`);
  }
  return `<g stroke="${theme.grid}" stroke-width="1" opacity="0.45">${lines.join('')}</g>`;
}

/**
 * @param {Column} column
 * @param {number} index
 * @param {Palette} theme
 */
function renderColumn(column, index, theme) {
  const x = PAD + index * (COLUMN_W + GAP);
  const centerX = x + COLUMN_W / 2;
  const accent = theme[column.accent];

  const items = column.items.map((item, row) => {
    const y = COLUMNS_Y + HEADER_H + 12 + row * (ITEM_H + ITEM_GAP);
    return `
    <g>
      <rect x="${x}" y="${y}" width="${COLUMN_W}" height="${ITEM_H}" rx="3"
            fill="${theme.panel}" stroke="${theme.border}" stroke-width="1"/>
      <rect x="${x}" y="${y}" width="2.5" height="${ITEM_H}" rx="1" fill="${accent}" opacity="0.9"/>
      <text x="${centerX}" y="${y + 17}" class="item" fill="${theme.text}">${escapeXml(item)}</text>
    </g>`;
  });

  return `
  <g>
    <rect x="${x}" y="${COLUMNS_Y}" width="${COLUMN_W}" height="${HEADER_H}" rx="3"
          fill="${accent}" opacity="0.14"/>
    <rect x="${x}" y="${COLUMNS_Y}" width="${COLUMN_W}" height="${HEADER_H}" rx="3"
          fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.85"/>
    <text x="${centerX}" y="${COLUMNS_Y + 17}" class="head" fill="${accent}">${escapeXml(column.title)}</text>
    ${items.join('')}
  </g>`;
}

/**
 * Chevrons in the gutters read as "flows into" without the clutter of arrows.
 *
 * @param {number} index gutter to the right of column `index`
 * @param {Palette} theme @param {number} height
 */
function renderChevron(index, theme, height) {
  const x = PAD + (index + 1) * COLUMN_W + index * GAP + GAP / 2;
  const y = (COLUMNS_Y + height - PAD) / 2;
  const delay = (0.25 * index).toFixed(2);
  return `<path class="chev" style="animation-delay:${delay}s" d="M${x - 3.5} ${y - 5} L${x + 2.5} ${y} L${x - 3.5} ${y + 5}"
        fill="none" stroke="${theme.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** @param {Palette} theme */
function renderStyles(theme) {
  return `
  <style>
    text { font-family: ${MONO_STACK}; text-anchor: middle; }
    .head  { font-size: 10px; font-weight: 700; letter-spacing: 2.4px; }
    .item  { font-size: 11px; letter-spacing: 0.4px; }
    .title { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-anchor: start; }

    .chev { animation: nudge 2.6s ease-in-out infinite; }
    @keyframes nudge {
      0%, 100% { opacity: .55; transform: translateX(0); }
      50%      { opacity: 1;   transform: translateX(2px); }
    }
    .pulse { animation: pulse 3.2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .chev, .pulse { animation: none; }
    }
  </style>
  <defs>
    <linearGradient id="stack-rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${theme.cyan}"/>
      <stop offset="50%"  stop-color="${theme.magenta}"/>
      <stop offset="100%" stop-color="${theme.orange}"/>
    </linearGradient>
  </defs>`;
}

/**
 * @param {Column[]} columns
 * @param {'dark' | 'light'} variant
 * @returns {string} standalone SVG document
 */
export function renderStack(columns, variant) {
  const theme = THEMES[variant];
  if (!theme) throw new Error(`Unknown stack variant: ${variant}`);

  const height = computeHeight(columns);
  const label = columns
    .map((column) => `${column.title}: ${column.items.join(', ')}`)
    .join('. ');

  const chevrons = Array.from({ length: columns.length - 1 }, (_, index) =>
    renderChevron(index, theme, height),
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${escapeXml(label)}">
  <title>${escapeXml(label)}</title>
${renderStyles(theme)}
  <rect width="${WIDTH}" height="${height}" rx="6" fill="${theme.bg}"/>
  ${renderGrid(theme, height)}
  <rect width="${WIDTH}" height="${height}" rx="6" fill="none" stroke="${theme.border}" stroke-width="1"/>

  <g>
    <rect x="${PAD}" y="22" width="3" height="12" fill="${theme.magenta}" class="pulse"/>
    <text x="${PAD + 12}" y="32" class="title" fill="${theme.text}">STACK MAP</text>
  </g>

  ${columns.map((column, index) => renderColumn(column, index, theme)).join('')}
  ${chevrons}

  <rect x="${PAD}" y="${height - 10}" width="${WIDTH - PAD * 2}" height="2" rx="1" fill="url(#stack-rule)" opacity="0.85"/>
</svg>
`;
}
