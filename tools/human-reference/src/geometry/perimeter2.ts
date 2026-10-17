import { V2 } from "./V2.ts";

/**
 * Polygonal arclength in input units, retaining the caller's open/closed interpretation.
 *
 * @evidence contracts/common.md#principled-implementation Summing Euclidean edge lengths measures polygonal arclength in physical input units.
 * @evidence contracts/common.md#clear-and-simple-design The caller explicitly chooses whether the final closing edge exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n) arithmetic and constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar sum survives as the result.
 */
export function perimeter2(points: V2[], closed: boolean = true): number {
  let total: number = 0;
  for (let i: number = 0; i < points.length - (closed ? 0 : 1); i++) {
    const a: V2 = points[i],
      b: V2 = points[(i + 1) % points.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}
