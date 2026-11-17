import type { AutoMovieVector3Tuple } from "@automovie/interface";

/**
 * Euclidean vector magnitude, retaining the operand's units.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Math.hypot computes Euclidean magnitude without changing physical units.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A scalar reduction avoids temporary vector allocations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/development/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no references.
 */
export const len: (a: AutoMovieVector3Tuple) => number = (
  a: AutoMovieVector3Tuple,
): number => Math.hypot(a[0], a[1], a[2]);
