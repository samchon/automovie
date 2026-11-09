import { V3 } from "./V3";

/**
 * Right-handed cross product in the operands' common Cartesian frame.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The determinant formula computes the right-handed Cartesian cross product.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The caller supplies both vectors in the same oriented frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/development/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh triple and retains no references.
 */
export const cross: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
