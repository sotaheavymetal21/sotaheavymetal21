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
import { renderStack } from './lib/render-stack.mjs';
import { renderTelemetry } from './lib/render-telemetry.mjs';
import { looksScopeLimited } from './lib/stats-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATS_FILE = resolve(ROOT, 'data/stats.json');
const ASSETS_DIR = resolve(ROOT, 'assets');

const GITHUB_LOGIN = 'sotaheavymetal21';
const QIITA_USER = 'sotaheavymetal21';

/** AWS SCS / SAA / DVA / SOA + IPA AP / FE / Information Security Management. */
const CERTIFICATION_COUNT = 7;

const HERO = Object.freeze({
  wordmark: 'sotaheavymetal21',
  role: 'FORWARD DEPLOYED ENGINEER',
  affiliation: 'TOKYO, JAPAN',
});

/** Layered view of the stack. Lists only what is actually worked with. */
const STACK = Object.freeze([
  { title: 'LANGUAGES', accent: 'cyan', items: ['Go', 'TypeScript', 'Python', 'Ruby'] },
  {
    title: 'FRAMEWORKS',
    accent: 'magenta',
    items: ['Gin · GORM', 'FastAPI', 'Django REST', 'Rails'],
  },
  {
    title: 'DATA',
    accent: 'green',
    items: ['PostgreSQL', 'MySQL', 'SQLAlchemy'],
  },
  {
    title: 'CLOUD · OPS',
    accent: 'orange',
    items: ['AWS', 'Google Cloud', 'OCI', 'Docker · Nginx', 'GitHub Actions'],
  },
]);

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

  const scopeLimited = github !== null && looksScopeLimited(github, fallback);
  if (scopeLimited) {
    console.warn(
      'GitHub token cannot read restricted contributions — keeping committed counts. ' +
        'Set a PROFILE_TOKEN secret (classic PAT, read:user) to refresh them.',
    );
  }

  const usableGitHub = scopeLimited ? null : github;

  const stats = {
    contributions: usableGitHub?.contributions ?? Number(fallback.contributions ?? 0),
    commits: usableGitHub?.commits ?? Number(fallback.commits ?? 0),
    privateContributions:
      usableGitHub?.privateContributions ?? Number(fallback.privateContributions ?? 0),
    articles: articles?.length ?? Number(fallback.articles ?? 0),
    certifications: CERTIFICATION_COUNT,
    syncedAt: usableGitHub || articles ? today() : String(fallback.syncedAt ?? today()),
  };

  await mkdir(ASSETS_DIR, { recursive: true });
  await mkdir(dirname(STATS_FILE), { recursive: true });

  await Promise.all([
    ...VARIANTS.map((variant) =>
      writeFile(resolve(ASSETS_DIR, `hero-${variant}.svg`), renderHero(HERO, variant)),
    ),
    ...VARIANTS.map((variant) =>
      writeFile(resolve(ASSETS_DIR, `stack-${variant}.svg`), renderStack(STACK, variant)),
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
