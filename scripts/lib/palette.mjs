/**
 * Neon cyberpunk palettes for generated SVG assets.
 *
 * Two variants are rendered for every asset so the README can switch between
 * them with `<picture media="(prefers-color-scheme: ...)">`. Keeping both in one
 * place guarantees the light variant never drifts away from the dark one.
 */

/** @typedef {{
 *   bg: string, panel: string, grid: string, border: string,
 *   cyan: string, magenta: string, green: string, orange: string,
 *   text: string, muted: string, scan: string, glow: number,
 * }} Palette */

/** @type {Palette} */
export const DARK = Object.freeze({
  bg: '#0D1117',
  panel: '#12182280',
  grid: '#1F2937',
  border: '#233044',
  cyan: '#7DCFFF',
  magenta: '#BB9AF7',
  green: '#9ECE6A',
  orange: '#FF9E64',
  text: '#C0CAF5',
  muted: '#565F89',
  scan: '#7DCFFF',
  glow: 0.55,
});

/** @type {Palette} */
export const LIGHT = Object.freeze({
  bg: '#FFFFFF',
  panel: '#F6F8FA',
  grid: '#E4E8EE',
  border: '#D5DBE3',
  cyan: '#0B7FA8',
  magenta: '#7C3AED',
  green: '#15803D',
  orange: '#C2410C',
  text: '#1F2328',
  muted: '#656D76',
  scan: '#0B7FA8',
  glow: 0.22,
});

export const THEMES = Object.freeze({ dark: DARK, light: LIGHT });

/**
 * Monospace stack resolved against the viewer's system fonts. SVG embedded in
 * an `<img>` cannot load webfonts, so only locally installed families work.
 */
export const MONO_STACK =
  "'JetBrains Mono','Fira Code','SFMono-Regular',ui-monospace,Menlo,Consolas,monospace";
