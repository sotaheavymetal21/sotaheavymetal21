import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderStack } from './render-stack.mjs';
import { DARK, LIGHT } from './palette.mjs';

const COLUMNS = Object.freeze([
  { title: 'LANGUAGES', accent: 'cyan', items: ['Go', 'TypeScript'] },
  { title: 'FRAMEWORKS', accent: 'magenta', items: ['Gin · GORM', 'Next.js · React'] },
  { title: 'DATA', accent: 'green', items: ['PostgreSQL', 'MySQL'] },
  { title: 'PLATFORM', accent: 'orange', items: ['AWS', 'Docker'] },
]);

test('emits a standalone SVG document', () => {
  const svg = renderStack(COLUMNS, 'dark');

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /width="860"/);
  assert.match(svg, /<\/svg>\n$/);
});

test('renders every column heading and item', () => {
  const svg = renderStack(COLUMNS, 'dark');

  for (const column of COLUMNS) {
    assert.match(svg, new RegExp(`>${column.title}<`));
    for (const item of column.items) {
      assert.match(svg, new RegExp(`>${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`));
    }
  }
});

test('grows taller as the longest column grows', () => {
  const short = renderStack(COLUMNS, 'dark');
  const tall = renderStack(
    [{ ...COLUMNS[0], items: ['a', 'b', 'c', 'd', 'e', 'f'] }, ...COLUMNS.slice(1)],
    'dark',
  );

  const heightOf = (svg) => Number(svg.match(/height="(\d+(?:\.\d+)?)"/)[1]);
  assert.ok(heightOf(tall) > heightOf(short));
});

test('draws one chevron per gutter', () => {
  const svg = renderStack(COLUMNS, 'dark');

  assert.equal(svg.match(/class="chev"/g)?.length, COLUMNS.length - 1);
});

test('each variant paints its own background', () => {
  assert.match(renderStack(COLUMNS, 'dark'), new RegExp(`fill="${DARK.bg}"`));
  assert.match(renderStack(COLUMNS, 'light'), new RegExp(`fill="${LIGHT.bg}"`));
});

test('describes the whole stack for screen readers', () => {
  const svg = renderStack(COLUMNS, 'dark');

  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="LANGUAGES: Go, TypeScript\./);
  assert.match(svg, /PLATFORM: AWS, Docker"/);
});

test('references no external resource', () => {
  const svg = renderStack(COLUMNS, 'dark');

  assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(svg, /<script/);
});

test('escapes XML metacharacters coming from content', () => {
  const svg = renderStack([{ title: 'A&B', accent: 'cyan', items: ['<x>'] }], 'dark');

  assert.match(svg, />A&amp;B</);
  assert.match(svg, />&lt;x&gt;</);
});

test('rejects an unknown variant', () => {
  assert.throws(() => renderStack(COLUMNS, 'neon'), /Unknown stack variant: neon/);
});
