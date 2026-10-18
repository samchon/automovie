import { V3 } from "./V3.ts";

/**
 * Scales a vector by a scalar without changing its frame.
 *
 * @evidence contracts/common.md#principled-implementation Scalar multiplication scales all three components uniformly.
 * @evidence contracts/common.md#clear-and-simple-design The scalar and vector are explicit inputs with no hidden unit conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one fresh triple with no retained state.
 */
export const mul = (a: V3, scale: number): V3 => [
  a[0] * scale,
  a[1] * scale,
  a[2] * scale,
];
