/**
 * Preserve the generation a thumbnail response actually names. A stale frame
 * can remain visible while another generation prepares, but cannot enter a
 * cache as current. Missing provenance is displayed as stale and is not cached.
 */
export function planHumanViewerThumbnailRevision(
  requested: string,
  actual: string | null,
  sourceStale: boolean,
) {
  const stale = sourceStale || actual === null || actual !== requested;
  return { revision: actual, stale, cache: !stale };
}
