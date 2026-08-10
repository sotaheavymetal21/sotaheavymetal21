import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderTelemetry, TELEMETRY_DIMENSIONS } from './render-telemetry.mjs';
import { DARK, LIGHT } from './palette.mjs';

const STATS = Object.freeze({
  contributions: 1663,
  commits: 837,
  privateContributions: 791,
  articles: 79,
  certifications: 7,
  syncedAt: '2026-08-10',
});

test('emits a standalone SVG document of the declared size', () => {
  const svg = renderTelemetry(STATS, 'dark');

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, new RegExp(`width="${TELEMETRY_DIMENSIONS.width}"`));
  assert.match(svg, new RegExp(`height="${TELEMETRY_DIMENSIONS.height}"`));
  assert.match(svg, /<\/svg>\n$/);
});

test('formats large numbers with thousands separators', () => {
  const svg = renderTelemetry(STATS, 'dark');

  assert.match(svg, />1,663</);
  assert.match(svg, />837</);
  assert.match(svg, /791 private/);
});

test('renders one panel per metric', () => {
  const svg = renderTelemetry(STATS, 'dark');

  assert.equal(svg.match(/class="panel"/g)?.length, 4);
  for (const label of ['CONTRIBUTIONS', 'COMMITS', 'ARTICLES', 'CERTIFICATIONS']) {
    assert.match(svg, new RegExp(`>${label}<`));
  }
});

test('each variant paints its own background', () => {
  assert.match(renderTelemetry(STATS, 'dark'), new RegExp(`fill="${DARK.bg}"`));
  assert.match(renderTelemetry(STATS, 'light'), new RegExp(`fill="${LIGHT.bg}"`));
});

test('carries an accessible name and title', () => {
  const svg = renderTelemetry(STATS, 'dark');

  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="[^"]+"/);
  assert.match(svg, /<title>telemetry — 1,663 contributions/);
});

test('honours prefers-reduced-motion', () => {
  const svg = renderTelemetry(STATS, 'dark');

  assert.match(svg, /@media \(prefers-reduced-motion: reduce\)/);
});

test('never hides content behind an animation', () => {
  // A static render — GitHub's image cache, a reduced-motion viewer, an email
  // digest — paints frame zero. Anything starting at opacity 0 disappears there.
  const svg = renderTelemetry(STATS, 'dark');
  const keyframeBlocks = svg.match(/@keyframes\s+\w+\s*\{[^}]*\}[^}]*\}/g) ?? [];
  const zeroPercentStates = keyframeBlocks.flatMap(
    (block) => block.match(/(?:^|[{;\s])0%[^{]*\{[^}]*\}/g) ?? [],
  );

  assert.ok(zeroPercentStates.length > 0, 'expected keyframes to declare a 0% state');
  for (const state of zeroPercentStates) {
    assert.doesNotMatch(state, /opacity:\s*0(?:\.0+)?\s*[;}]/);
  }
  assert.doesNotMatch(svg, /class="(?:panel|value|label|caption)"[^>]*opacity:\s*0[;"]/);
});

test('references no external resource', () => {
  const svg = renderTelemetry(STATS, 'dark');

  assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(svg, /<script/);
  assert.doesNotMatch(svg, /@font-face/);
});

test('escapes XML metacharacters coming from data', () => {
  const svg = renderTelemetry({ ...STATS, syncedAt: '<&">' }, 'dark');

  assert.match(svg, /SYNCED &lt;&amp;&quot;&gt;/);
  assert.doesNotMatch(svg, /SYNCED <&">/);
});

test('rejects an unknown variant', () => {
  assert.throws(() => renderTelemetry(STATS, 'neon'), /Unknown telemetry variant: neon/);
});
