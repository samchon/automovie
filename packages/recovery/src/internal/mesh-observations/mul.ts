import type { AutoMovieVector3Tuple } from "@automovie/interface";

/**
 * Scales a vector by a scalar without changing its frame.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Scalar multiplication scales all three components uniformly.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The scalar and vector are explicit inputs with no hidden unit conversion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/development/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh triple with no retained state.
 */
export const mul: (
  a: AutoMovieVector3Tuple,
  scale: number,
) => AutoMovieVector3Tuple = (
  a: AutoMovieVector3Tuple,
  scale: number,
): AutoMovieVector3Tuple => [a[0] * scale, a[1] * scale, a[2] * scale];
