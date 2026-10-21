/**
 * Closed identity of the operation that produced a recovery outcome.
 *
 * @evidence contracts/common.md#principled-implementation Explicit named fields preserve the recorded quantities and their existing units.
 * @evidence contracts/common.md#clear-and-simple-design This independently named contract is shared by producers and consumers without an anonymous object substitute.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration computes no values, infers no observations and supplies no fallback.
 * @evidence contracts/common.md#meaningful-documentation Members describe quantity, identity or optional-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
 */
export type AutoMovieRecoveryOperator =
  | "legacy-contour-v1"
  | "registered-triangles-v1"
  | "orthographic-images-v1"
  | "image-elliptic-loft-v1"
  | "image-support-loft-v1"
  | "calibrated-image-pair-v1"
  | "calibrated-three-camera-map-v1"
  | "calibrated-camera-scene-v1"
  | "json-publication-v1";
