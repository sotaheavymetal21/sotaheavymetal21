import assert from 'node:assert/strict';
import { test } from 'node:test';

import { looksScopeLimited } from './stats-guard.mjs';

const COMMITTED = Object.freeze({ contributions: 1663, privateContributions: 791 });

test('flags the drop a workflow GITHUB_TOKEN produces', () => {
  const fresh = { contributions: 872, privateContributions: 0 };

  assert.equal(looksScopeLimited(fresh, COMMITTED), true);
});

test('accepts a normal refresh that still sees private activity', () => {
  const fresh = { contributions: 1700, privateContributions: 800 };

  assert.equal(looksScopeLimited(fresh, COMMITTED), false);
});

test('accepts a decline that still sees private activity', () => {
  const fresh = { contributions: 1200, privateContributions: 400 };

  assert.equal(looksScopeLimited(fresh, COMMITTED), false);
});

test('accepts zero private activity when the total did not fall', () => {
  // A genuinely all-public year: nothing was hidden from the token.
  const fresh = { contributions: 1700, privateContributions: 0 };

  assert.equal(looksScopeLimited(fresh, COMMITTED), false);
});

test('does not flag anything on the first run', () => {
  const fresh = { contributions: 872, privateContributions: 0 };

  assert.equal(looksScopeLimited(fresh, null), false);
  assert.equal(looksScopeLimited(fresh, {}), false);
  assert.equal(looksScopeLimited(fresh, { contributions: 0, privateContributions: 0 }), false);
});
