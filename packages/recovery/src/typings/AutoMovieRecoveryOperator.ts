/**
 * Closed identity of the operation that produced a recovery outcome.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit named fields preserve the recorded quantities and their existing units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This independently named contract is shared by producers and consumers without an anonymous object substitute.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration computes no values, infers no observations and supplies no fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members describe quantity, identity or optional-state meaning.
 */
export type AutoMovieRecoveryOperator =
  | "legacy-contour-v1"
  | "registered-triangles-v1"
  | "ordered-polyline-v1"
  | "physical-sections-v1"
  | "source-slabs-v1"
  | "contour-resume-v1"
  | "orthographic-images-v1"
  | "image-elliptic-loft-v1"
  | "image-support-loft-v1"
  | "calibrated-image-pair-v1"
  | "calibrated-three-camera-map-v1"
  | "calibrated-camera-scene-v1"
  | "json-publication-v1";
