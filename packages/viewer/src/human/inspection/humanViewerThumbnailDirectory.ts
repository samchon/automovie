/**
 * The directory name that holds every thumbnail of one display source
 * revision, the first sixteen hex digits of its digest.
 * The caller supplies the already established source revision; this helper
 * does not validate a path or choose which revision may be removed.
 *
 * @evidence contracts/common.md#principled-implementation A deterministic prefix of the established source digest groups thumbnails belonging to that same display revision.
 * @evidence contracts/common.md#clear-and-simple-design One naming function keeps thumbnail storage and its lookup on the same directory convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The directory follows the caller's source identity rather than a subject name, expected image or age-based pruning rule.
 * @evidence contracts/common.md#meaningful-documentation States the sixteen-character naming rule and separates naming from path admission and removal ownership.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Groups inspection thumbnails by the caller's existing source-revision prefix so lookup and storage use the same display directory.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view The helper only spells the sixteen-character directory convention; it neither verifies a source generation nor creates a production frame fingerprint.
 */
export const humanViewerThumbnailDirectory = (revision: string): string =>
  revision.slice(0, 16);
