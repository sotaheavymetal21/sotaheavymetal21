/**
 * Data sources for the generated profile assets.
 *
 * Every fetch is best-effort: callers pass a fallback so a transient API outage
 * degrades to the previously committed numbers instead of wiping the README.
 */

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const QIITA_API = 'https://qiita.com/api/v2';
const TIMEOUT_MS = 20_000;

const CONTRIBUTIONS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions }
      }
    }
  }
`;

/**
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Contribution totals for the trailing 12 months.
 *
 * @param {{ login: string, token: string }} params
 * @returns {Promise<{ contributions: number, commits: number, pullRequests: number, issues: number, privateContributions: number } | null>}
 *   `null` when the API is unreachable or returns an unexpected shape.
 */
export async function fetchGitHubStats({ login, token }) {
  if (!token) return null;

  try {
    const response = await fetchWithTimeout(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': `${login}-profile-generator`,
      },
      body: JSON.stringify({
        query: CONTRIBUTIONS_QUERY,
        variables: { login },
      }),
    });

    if (!response.ok) return null;

    const body = await response.json();
    const collection = body?.data?.user?.contributionsCollection;
    if (!collection) return null;

    return {
      contributions: collection.contributionCalendar?.totalContributions ?? 0,
      commits: collection.totalCommitContributions ?? 0,
      pullRequests: collection.totalPullRequestContributions ?? 0,
      issues: collection.totalIssueContributions ?? 0,
      privateContributions: collection.restrictedContributionsCount ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Published Qiita articles, newest first.
 *
 * @param {{ user: string }} params
 * @returns {Promise<Array<{ title: string, url: string, likes: number, stocks: number, tags: string[], publishedAt: string }> | null>}
 */
export async function fetchQiitaArticles({ user }) {
  try {
    const response = await fetchWithTimeout(
      `${QIITA_API}/users/${encodeURIComponent(user)}/items?per_page=100`,
      { headers: { 'User-Agent': `${user}-profile-generator` } },
    );

    if (!response.ok) return null;

    const items = await response.json();
    if (!Array.isArray(items)) return null;

    return items.map((item) => ({
      title: String(item.title ?? '').trim(),
      url: String(item.url ?? ''),
      likes: Number(item.likes_count ?? 0),
      stocks: Number(item.stocks_count ?? 0),
      tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag.name)) : [],
      publishedAt: String(item.created_at ?? ''),
    }));
  } catch {
    return null;
  }
}
