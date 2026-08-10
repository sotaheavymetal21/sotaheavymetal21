/**
 * Guards the committed stats against a silent downgrade.
 *
 * `contributionsCollection` only reports restricted (private) activity to a
 * token that is allowed to see it. A workflow's default `GITHUB_TOKEN` is an
 * app installation token and is not — it returns `restrictedContributionsCount: 0`
 * and a correspondingly smaller total.
 *
 * Without this check a scheduled run would quietly rewrite 1,663 contributions
 * down to the public-only figure. Detecting the drop and keeping the last known
 * good numbers is the honest failure mode; supplying a user PAT is the fix.
 */

/**
 * @typedef {{ contributions: number, privateContributions: number }} StatsLike
 */

/**
 * @param {StatsLike} fresh values just fetched from the API
 * @param {Partial<StatsLike> | null | undefined} previous values already committed
 * @returns {boolean} true when `fresh` looks like it came from a token that
 *   cannot see restricted contributions
 */
export function looksScopeLimited(fresh, previous) {
  const priorPrivate = Number(previous?.privateContributions ?? 0);
  if (!Number.isFinite(priorPrivate) || priorPrivate <= 0) return false;

  const freshPrivate = Number(fresh?.privateContributions ?? 0);
  if (freshPrivate > 0) return false;

  // A real drop to zero private activity would also drop the total. Only treat
  // this as a scope problem when the total fell by roughly the private share.
  const priorTotal = Number(previous?.contributions ?? 0);
  const freshTotal = Number(fresh?.contributions ?? 0);
  return priorTotal > 0 && freshTotal < priorTotal;
}
