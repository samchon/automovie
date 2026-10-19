import { V3 } from "./V3";

/**
 * Euclidean inner product; units are the product of the operands' units.
 *
 * @evidence contracts/common.md#principled-implementation The Euclidean inner product multiplies corresponding Cartesian components and sums them.
 * @evidence contracts/common.md#clear-and-simple-design A scalar result exposes the operation without coordinate adapters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar and retains no references.
 */
export const dot: (a: V3, b: V3) => number = (a: V3, b: V3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
