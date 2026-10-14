/**
 * Preserve the generation a thumbnail response actually names. A stale frame can remain visible while another generation prepares, but cannot enter a cache as current. Missing provenance is displayed as stale and is not cached.
 *
 * @evidence contracts/common.md#principled-implementation Actual response revision is preserved verbatim and cache admission requires both exact requested-revision equality and absence of the server's stale flag.
 * @evidence contracts/common.md#clear-and-simple-design One scalar metadata decision keeps thumbnail byte authority separate from fetch, cache IO and DOM publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing actual provenance or explicitly stale output is never relabelled with the request-time source revision.
 * @evidence contracts/common.md#meaningful-documentation The comment explains stale visibility, actual authority preservation and exclusion of missing or stale bytes from current cache.
 * @evidence contracts/performance.md#efficient-algorithms One revision comparison and boolean decisions use O(r) string-comparison time in the worst case for r revision characters, with a constant-size returned decision record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure authority planner owns no stored picture or numerical result; the thumbnail loader implements actual byte reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The decision carries a nullable source string and booleans without acquiring a response, object URL or image handle.
 */
export function planHumanViewerThumbnailRevision(
  requested: string,
  actual: string | null,
  sourceStale: boolean,
): {
  /** Actual response revision, including absent provenance as null. */
  revision: string | null;

  /** Whether display must remain explicitly stale. */
  stale: boolean;

  /** Whether these bytes can be stored under their actual current revision. */
  cache: boolean;
} {
  const stale: boolean = sourceStale || actual === null || actual !== requested;
  return { revision: actual, stale, cache: !stale };
}
