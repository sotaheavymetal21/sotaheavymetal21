/**
 * Marker-delimited region replacement for README.md.
 *
 * Generated sections are wrapped in `<!-- NAME:START -->` / `<!-- NAME:END -->`
 * so a workflow can refresh them without owning the whole file.
 */

/** @param {string} name */
export function startMarker(name) {
  return `<!-- ${name}:START -->`;
}

/** @param {string} name */
export function endMarker(name) {
  return `<!-- ${name}:END -->`;
}

/**
 * Replaces the content between a marker pair, leaving the markers in place.
 *
 * @param {string} source full README text
 * @param {string} name marker name, e.g. `QIITA`
 * @param {string} content replacement body (markers and blank lines are added)
 * @returns {string} the updated document
 * @throws {Error} when either marker is missing or they appear out of order —
 *   failing loudly beats silently writing a README with a lost section.
 */
export function replaceMarkedSection(source, name, content) {
  const open = startMarker(name);
  const close = endMarker(name);

  const openIndex = source.indexOf(open);
  const closeIndex = source.indexOf(close);

  if (openIndex === -1) throw new Error(`Missing marker: ${open}`);
  if (closeIndex === -1) throw new Error(`Missing marker: ${close}`);
  if (closeIndex < openIndex) throw new Error(`Markers out of order for: ${name}`);

  const head = source.slice(0, openIndex + open.length);
  const tail = source.slice(closeIndex);

  return `${head}\n${content.trim()}\n${tail}`;
}
