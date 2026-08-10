import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderArticleTable, selectTopArticles } from './render-articles.mjs';

/** @param {Partial<Parameters<typeof renderArticleTable>[0][number]>} overrides */
function article(overrides = {}) {
  return {
    title: 'A title',
    url: 'https://qiita.com/u/items/1',
    likes: 1,
    tags: ['Go'],
    publishedAt: '2026-01-01T00:00:00+09:00',
    ...overrides,
  };
}

test('renders a header row and one row per article', () => {
  const table = renderArticleTable([article(), article({ title: 'Second' })]);
  const lines = table.split('\n');

  assert.equal(lines.length, 4);
  assert.equal(lines[0], '| # | Article | Tags | ♥ |');
  assert.match(lines[2], /`01`/);
  assert.match(lines[3], /`02`/);
});

test('links the title and shows the like count', () => {
  const table = renderArticleTable([
    article({ title: 'Neon', url: 'https://qiita.com/x', likes: 24 }),
  ]);

  assert.match(table, /\[Neon\]\(https:\/\/qiita\.com\/x\)/);
  assert.match(table, /\*\*24\*\*/);
});

test('escapes pipes so a title cannot break the table', () => {
  const table = renderArticleTable([article({ title: 'a | b' })]);
  const row = table.split('\n')[2];

  assert.match(row, /a \\\| b/);
  assert.equal(row.split(/(?<!\\)\|/).length - 1, 5);
});

test('escapes brackets so a title cannot break the link', () => {
  const table = renderArticleTable([article({ title: '[FastAPI] DI' })]);

  assert.match(table, /\\\[FastAPI\\\] DI/);
});

test('truncates long multi-byte titles without splitting the row', () => {
  const table = renderArticleTable([article({ title: 'あ'.repeat(120) })]);
  const row = table.split('\n')[2];

  assert.match(row, /…/);
  assert.ok([...row].length < 120);
});

test('caps the tag list at three entries', () => {
  const table = renderArticleTable([
    article({ tags: ['Python', 'FastAPI', 'Pydantic', 'i18n', 'Validation'] }),
  ]);

  assert.match(table, /`Python` `FastAPI` `Pydantic`/);
  assert.doesNotMatch(table, /`i18n`/);
});

test('falls back to a placeholder when there are no articles', () => {
  assert.equal(renderArticleTable([]), '_No articles to show right now._');
});

test('selectTopArticles orders by likes, then recency', () => {
  const input = [
    article({ title: 'low', likes: 1 }),
    article({ title: 'older-tie', likes: 9, publishedAt: '2025-01-01T00:00:00+09:00' }),
    article({ title: 'newer-tie', likes: 9, publishedAt: '2026-06-01T00:00:00+09:00' }),
    article({ title: 'top', likes: 24 }),
  ];

  const result = selectTopArticles(input, 3).map((item) => item.title);

  assert.deepEqual(result, ['top', 'newer-tie', 'older-tie']);
});

test('selectTopArticles does not mutate its input', () => {
  const input = [article({ title: 'a', likes: 1 }), article({ title: 'b', likes: 5 })];
  const snapshot = input.map((item) => item.title);

  selectTopArticles(input, 2);

  assert.deepEqual(input.map((item) => item.title), snapshot);
});
