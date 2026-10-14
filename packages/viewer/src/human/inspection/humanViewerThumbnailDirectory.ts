/**
 * The directory name that holds every thumbnail of one display source revision, the first sixteen hex digits of its digest. The caller supplies the already established source revision; this helper does not validate a path or choose which revision may be removed.
 *
 * @evidence contracts/common.md#principled-implementation The established source revision's first sixteen characters form the existing per-revision thumbnail directory name.
 * @evidence contracts/common.md#clear-and-simple-design A direct slice implements naming while pruning selection remains with its own owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper does not certify hex validity or path safety; callers must supply the already established revision authority.
 * @evidence contracts/common.md#meaningful-documentation The comment states prefix length and explicitly assigns validation and removal decisions to callers.
 * @evidence contracts/performance.md#efficient-algorithms Slicing a fixed sixteen-character prefix chooses no input-sized directory or thumbnail processing algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical revision-prefix naming is shared by file lookup and pruning, without a second naming cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a short returned name survives, and no directory is created, opened or retained.
 */
export const humanViewerThumbnailDirectory: (revision: string) => string = (
  revision: string,
): string => revision.slice(0, 16);
