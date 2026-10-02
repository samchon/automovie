/**
 * Preserve the generation a thumbnail response actually names. A stale frame
 * can remain visible while another generation prepares, but cannot enter a
 * cache as current. Missing provenance is displayed as stale and is not cached.
 *
 * @evidence contracts/common.md#principled-implementation Response provenance, source staleness and requested generation jointly determine whether pixels have current cache authority.
 * @evidence contracts/common.md#clear-and-simple-design One pure decision supplies display staleness and cache admission to the thumbnail loader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never relabels response pixels with the revision current when their request finishes.
 * @evidence contracts/common.md#meaningful-documentation States the visible-last-good and missing-provenance behavior.
 */
export function planHumanViewerThumbnailRevision(
  requested: string,
  actual: string | null,
  sourceStale: boolean,
) {
  const stale = sourceStale || actual === null || actual !== requested;
  return { revision: actual, stale, cache: !stale };
}
