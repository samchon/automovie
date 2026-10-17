import { V3 } from "./V3.ts";

/**
 * Adds vectors expressed in the same frame and units.
 *
 * @evidence contracts/common.md#principled-implementation Componentwise addition preserves the operands common Cartesian frame and units.
 * @evidence contracts/common.md#clear-and-simple-design One pure binary operation leaves coordinate registration to its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A new result triple is returned; inputs are neither mutated nor retained.
 */
export const add = (a: V3, b: V3): V3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
