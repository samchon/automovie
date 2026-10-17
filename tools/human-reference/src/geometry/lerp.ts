import { V3 } from "./V3.ts";

/**
 * Affine interpolation; t outside [0,1] explicitly extrapolates.
 *
 * @evidence contracts/common.md#principled-implementation Affine interpolation preserves a segment for t in [0,1] and explicitly extrapolates outside it.
 * @evidence contracts/common.md#clear-and-simple-design The interpolation parameter is supplied directly without clamping observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic over three coordinates.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh triple with no retained inputs.
 */
export const lerp = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
