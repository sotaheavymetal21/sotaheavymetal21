import assert from 'node:assert/strict';
import { test } from 'node:test';

import { endMarker, replaceMarkedSection, startMarker } from './readme-markers.mjs';

const DOC = `# Title

${startMarker('QIITA')}
old body
${endMarker('QIITA')}

footer
`;

test('replaces the body while keeping both markers', () => {
  const result = replaceMarkedSection(DOC, 'QIITA', 'new body');

  assert.match(result, /<!-- QIITA:START -->\nnew body\n<!-- QIITA:END -->/);
  assert.doesNotMatch(result, /old body/);
});

test('preserves content outside the markers', () => {
  const result = replaceMarkedSection(DOC, 'QIITA', 'new body');

  assert.match(result, /^# Title\n/);
  assert.match(result, /footer\n$/);
});

test('trims stray whitespace around the replacement', () => {
  const result = replaceMarkedSection(DOC, 'QIITA', '\n\n  padded  \n\n');

  assert.match(result, /<!-- QIITA:START -->\npadded\n<!-- QIITA:END -->/);
});

test('is idempotent when the body is unchanged', () => {
  const once = replaceMarkedSection(DOC, 'QIITA', 'stable');
  const twice = replaceMarkedSection(once, 'QIITA', 'stable');

  assert.equal(once, twice);
});

test('throws when the opening marker is absent', () => {
  assert.throws(
    () => replaceMarkedSection('# Title\n', 'QIITA', 'body'),
    /Missing marker: <!-- QIITA:START -->/,
  );
});

test('throws when the closing marker is absent', () => {
  assert.throws(
    () => replaceMarkedSection(`${startMarker('QIITA')}\n`, 'QIITA', 'body'),
    /Missing marker: <!-- QIITA:END -->/,
  );
});

test('throws when the markers are inverted', () => {
  const inverted = `${endMarker('STATS')}\nbody\n${startMarker('STATS')}\n`;

  assert.throws(() => replaceMarkedSection(inverted, 'STATS', 'x'), /out of order/);
});
