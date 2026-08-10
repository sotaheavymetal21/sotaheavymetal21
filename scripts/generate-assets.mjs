#!/usr/bin/env node
/**
 * Regenerates every committed SVG asset (`assets/*-{dark,light}.svg`) from live
 * GitHub and Qiita data.
 *
 * Falls back to `data/stats.json` whenever an API is unreachable, so a network
 * blip refreshes nothing rather than publishing zeroes. The fallback file is
 * rewritten only after a successful fetch.
 *
 * Usage: GITHUB_TOKEN=... node scripts/generate-assets.mjs
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchGitHubStats, fetchQiitaArticles } from './lib/fetch-stats.mjs';
import { renderHero } from './lib/render-hero.mjs';
import { renderTelemetry } from './lib/render-telemetry.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATS_FILE = resolve(ROOT, 'data/stats.json');
const ASSETS_DIR = resolve(ROOT, 'assets');

const GITHUB_LOGIN = 'sotaheavymetal21';
const QIITA_USER = 'sotaheavymetal21';

/** AWS SCS / SAA / DVA / SOA + IPA AP / FE / Information Security Management. */
const CERTIFICATION_COUNT = 7;

const HERO = Object.freeze({
  wordmark: 'SOTAHEAVYMETAL21',
  role: 'FORWARD DEPLOYED ENGINEER',
  affiliation: 'AI SHIFT, INC. — CYBERAGENT GROUP  //  TOKYO, JAPAN',
});

const VARIANTS = /** @type {const} */ (['dark', 'light']);

/** @returns {Promise<Record<string, number|string>>} */
async function readFallback() {
  try {
    return JSON.parse(await readFile(STATS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

/** @returns {string} today's date as YYYY-MM-DD in UTC */
function today() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const fallback = await readFallback();

  const [github, articles] = await Promise.all([
    fetchGitHubStats({ login: GITHUB_LOGIN, token: process.env.GITHUB_TOKEN ?? '' }),
    fetchQiitaArticles({ user: QIITA_USER }),
  ]);

  if (!github) console.warn('GitHub stats unavailable — reusing committed values.');
  if (!articles) console.warn('Qiita stats unavailable — reusing committed values.');

  const stats = {
    contributions: github?.contributions ?? Number(fallback.contributions ?? 0),
    commits: github?.commits ?? Number(fallback.commits ?? 0),
    privateContributions:
      github?.privateContributions ?? Number(fallback.privateContributions ?? 0),
    articles: articles?.length ?? Number(fallback.articles ?? 0),
    certifications: CERTIFICATION_COUNT,
    syncedAt: github || articles ? today() : String(fallback.syncedAt ?? today()),
  };

  await mkdir(ASSETS_DIR, { recursive: true });
  await mkdir(dirname(STATS_FILE), { recursive: true });

  await Promise.all([
    ...VARIANTS.map((variant) =>
      writeFile(resolve(ASSETS_DIR, `hero-${variant}.svg`), renderHero(HERO, variant)),
    ),
    ...VARIANTS.map((variant) =>
      writeFile(resolve(ASSETS_DIR, `telemetry-${variant}.svg`), renderTelemetry(stats, variant)),
    ),
    writeFile(STATS_FILE, `${JSON.stringify(stats, null, 2)}\n`),
  ]);

  console.log(
    `assets: ${stats.contributions} contributions / ${stats.commits} commits / ` +
      `${stats.articles} articles (synced ${stats.syncedAt})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
