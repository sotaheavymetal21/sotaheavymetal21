#!/usr/bin/env node
/**
 * Refreshes the Qiita article table between the `QIITA` markers in README.md.
 *
 * The Qiita v2 endpoint used here is public, so no secret is required. When the
 * API is unreachable the README is left untouched and the process exits 0 — a
 * stale table beats an empty one.
 *
 * Usage: node scripts/sync-qiita.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchQiitaArticles } from './lib/fetch-stats.mjs';
import { renderArticleTable, selectTopArticles } from './lib/render-articles.mjs';
import { replaceMarkedSection } from './lib/readme-markers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = resolve(ROOT, 'README.md');

const QIITA_USER = 'sotaheavymetal21';
const TOP_ARTICLE_COUNT = 5;

async function main() {
  const articles = await fetchQiitaArticles({ user: QIITA_USER });

  if (!articles) {
    console.warn('Qiita API unavailable — README left unchanged.');
    return;
  }

  const table = renderArticleTable(selectTopArticles(articles, TOP_ARTICLE_COUNT));
  const source = await readFile(README, 'utf8');
  const updated = replaceMarkedSection(source, 'QIITA', table);

  if (updated === source) {
    console.log('Qiita section already up to date.');
    return;
  }

  await writeFile(README, updated);
  console.log(`Qiita section updated from ${articles.length} articles.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
