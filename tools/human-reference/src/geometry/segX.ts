import { V2 } from "./V2.ts";

/**
 * Strict interior segment crossing; tangencies and collinear overlaps are deliberately unclassified.
 *
 * @evidence contracts/common.md#principled-implementation Opposite strict orientation signs on both segments identify interior crossings.
 * @evidence contracts/common.md#clear-and-simple-design Tangencies and collinear overlaps remain explicitly outside this predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant determinant arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean without retaining inputs.
 */
export function segX(a: V2, b: V2, c: V2, d: V2): boolean {
  const side = (p: V2, q: V2, r: V2): number =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return side(c, d, a) * side(c, d, b) < 0 && side(a, b, c) * side(a, b, d) < 0;
}
