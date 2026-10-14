/**
 * Caller-selected URLs for typed head/body definitions of one person editor, separate from its authored numerical document.
 *
 * The ordinary source parser requires a complete HTTP(S) or caller-owned blob pair and resolves relative URLs before worker propagation. Fetch and numerical generation owners separately check bytes, schema, pairing and geometry; URL text alone proves none of those properties or immutable content.
 *
 * @evidence contracts/common.md#principled-implementation A complete caller-selected source pair reaches the ordinary worker generation consumers separately from personal authored parameters.
 * @evidence contracts/common.md#clear-and-simple-design The URL view carries asset locations while parser protocol checks, fetch and generation admission retain their own authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bundled generation is inferred from omission, URL text is not proof of typed/immutable content and personal document fields carry no raw geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies pair selection, relative resolution, allowed transport protocols and separate content/pairing checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data view implements no URL resolution, fetch or generation parsing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source URLs are not declared content digests or cached generation equivalence by this interface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary URL strings acquire no blob ownership, fetch task or resident numerical generation.
 *
 * @author Samchon
 */
export interface IConnectedPersonSourceUrls {
  /** URL of the existing typed head partition view, including its generation id. */
  head: string;

  /** URL of its paired typed body view; no personal vertices enter the document. */
  body: string;
}
