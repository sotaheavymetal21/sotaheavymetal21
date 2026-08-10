import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HERO_DIMENSIONS, renderHero } from './render-hero.mjs';
import { DARK, LIGHT } from './palette.mjs';

const CONTENT = Object.freeze({
  wordmark: 'SOTAHEAVYMETAL21',
  role: 'FORWARD DEPLOYED ENGINEER',
  affiliation: 'AI SHIFT, INC. — CYBERAGENT GROUP  //  TOKYO, JAPAN',
});

test('emits a standalone SVG document of the declared size', () => {
  const svg = renderHero(CONTENT, 'dark');

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, new RegExp(`width="${HERO_DIMENSIONS.width}"`));
  assert.match(svg, new RegExp(`height="${HERO_DIMENSIONS.height}"`));
  assert.match(svg, /<\/svg>\n$/);
});

test('paints the wordmark three times for chromatic aberration', () => {
  const svg = renderHero(CONTENT, 'dark');
  const occurrences = svg.match(/>SOTAHEAVYMETAL21</g) ?? [];

  assert.equal(occurrences.length, 3);
  assert.match(svg, /class="mark ghost-cyan"/);
  assert.match(svg, /class="mark ghost-magenta"/);
});

test('every wordmark copy stays visible in a static frame', () => {
  const svg = renderHero(CONTENT, 'dark');
  const marks = svg.match(/<text class="mark[^>]*>/g) ?? [];

  assert.equal(marks.length, 3);
  for (const mark of marks) {
    const opacity = mark.match(/opacity="([\d.]+)"/)?.[1];
    assert.ok(opacity === undefined || Number(opacity) > 0.5, `faint copy: ${mark}`);
  }
});

test('renders the role and affiliation lines', () => {
  const svg = renderHero(CONTENT, 'dark');

  assert.match(svg, />FORWARD DEPLOYED ENGINEER</);
  assert.match(svg, /AI SHIFT, INC\. — CYBERAGENT GROUP/);
});

test('each variant paints its own background', () => {
  assert.match(renderHero(CONTENT, 'dark'), new RegExp(`fill="${DARK.bg}"`));
  assert.match(renderHero(CONTENT, 'light'), new RegExp(`fill="${LIGHT.bg}"`));
});

test('carries an accessible name and title', () => {
  const svg = renderHero(CONTENT, 'dark');

  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="SOTAHEAVYMETAL21 — FORWARD DEPLOYED ENGINEER"/);
});

test('honours prefers-reduced-motion', () => {
  assert.match(renderHero(CONTENT, 'dark'), /@media \(prefers-reduced-motion: reduce\)/);
});

test('references no external resource', () => {
  const svg = renderHero(CONTENT, 'dark');

  assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(svg, /<script/);
  assert.doesNotMatch(svg, /@font-face/);
});

test('escapes XML metacharacters coming from content', () => {
  const svg = renderHero({ ...CONTENT, role: 'A & B <hack>' }, 'dark');

  assert.match(svg, /A &amp; B &lt;hack&gt;/);
  assert.doesNotMatch(svg, /<hack>/);
});

test('rejects an unknown variant', () => {
  assert.throws(() => renderHero(CONTENT, 'neon'), /Unknown hero variant: neon/);
});
