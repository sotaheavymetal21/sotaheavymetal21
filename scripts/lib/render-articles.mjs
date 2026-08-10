/**
 * Renders the Qiita article table injected into the README.
 */

const MAX_TITLE_LENGTH = 58;
const MAX_TAGS = 3;

/**
 * Escapes the characters that would break out of a Markdown table cell or link.
 *
 * @param {string} value
 */
function escapeCell(value) {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** @param {string} value */
function escapeLinkText(value) {
  return escapeCell(value).replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

/**
 * Truncates on grapheme-ish boundaries so multi-byte Japanese titles stay intact.
 *
 * @param {string} value
 */
function truncate(value) {
  const characters = [...value];
  if (characters.length <= MAX_TITLE_LENGTH) return value;
  return `${characters.slice(0, MAX_TITLE_LENGTH - 1).join('').trimEnd()}…`;
}

/**
 * @typedef {{ title: string, url: string, likes: number, tags: string[] }} Article
 */

/**
 * @param {Article[]} articles already sorted, already sliced to the wanted length
 * @returns {string} a Markdown table, or a placeholder when the list is empty
 */
export function renderArticleTable(articles) {
  if (articles.length === 0) {
    return '_No articles to show right now._';
  }

  const rows = articles.map((article, index) => {
    const rank = String(index + 1).padStart(2, '0');
    const title = escapeLinkText(truncate(article.title));
    const tags = article.tags
      .slice(0, MAX_TAGS)
      .map((tag) => `\`${escapeCell(tag)}\``)
      .join(' ');
    return `| \`${rank}\` | [${title}](${article.url}) | ${tags} | **${article.likes}** |`;
  });

  return [
    '| # | Article | Tags | ♥ |',
    '|:--|:--|:--|--:|',
    ...rows,
  ].join('\n');
}

/**
 * Picks the most-liked articles, breaking ties by recency.
 *
 * @param {Array<Article & { publishedAt: string }>} articles
 * @param {number} limit
 * @returns {Array<Article & { publishedAt: string }>} a new sorted array
 */
export function selectTopArticles(articles, limit) {
  return [...articles]
    .sort((a, b) => b.likes - a.likes || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
