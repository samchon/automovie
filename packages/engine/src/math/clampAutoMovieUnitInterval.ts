/**
 * Clamp a scalar into the closed unit interval [0, 1].
 *
 * Values below zero become zero and values above one become one; NaN stays
 * NaN, so a malformed input is never disguised as an endpoint. Segment
 * parameters and blend fractions share this one owner.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds a segment parameter or blend fraction to its closed domain for composable geometry operations.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Keeps clamped parameters inside the feature they address while leaving NaN unrepaired.
 * @author Samchon
 */
export function clampAutoMovieUnitInterval(value: number): number {
  return Math.min(1, Math.max(0, value));
}
