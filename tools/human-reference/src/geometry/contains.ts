import { V2 } from "./V2.ts";

/**
 * Odd-even ray polygon containment; boundary contact is not a robust inside/outside certificate.
 *
 * @evidence contracts/common.md#principled-implementation Odd-even horizontal ray crossings define polygon interior under the stated boundary ambiguity.
 * @evidence contracts/common.md#clear-and-simple-design Boundary contact is not promoted to a robust material-classification certificate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n) ray/edge comparisons and constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean without retaining the polygon.
 */
export function contains(polygon: V2[], point: V2): boolean {
  let inside: boolean = false;
  for (
    let i: number = 0, j: number = polygon.length - 1;
    i < polygon.length;
    j = i++
  ) {
    const a: V2 = polygon[i],
      b: V2 = polygon[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
