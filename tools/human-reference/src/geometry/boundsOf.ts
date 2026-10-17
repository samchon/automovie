import { V3 } from "./V3.ts";

/**
 * Axis-aligned physical point bounds; an empty collection has no finite box and is rejected.
 *
 * @evidence contracts/common.md#principled-implementation Coordinatewise minima and maxima give the axis-aligned physical point box.
 * @evidence contracts/common.md#clear-and-simple-design Empty input is rejected rather than publishing infinite bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n) point traversal and constant auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two fresh triples without retaining the point set.
 */
export function boundsOf(points: V3[]): { lo: V3; hi: V3 } {
  if (!points.length) throw new Error("Empty point set has no bounds");
  const lo: V3 = [Infinity, Infinity, Infinity],
    hi: V3 = [-Infinity, -Infinity, -Infinity];
  for (const p of points)
    for (let k: number = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p[k]);
      hi[k] = Math.max(hi[k], p[k]);
    }
  return { lo, hi };
}
