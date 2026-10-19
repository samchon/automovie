import { V2 } from "./V2";

/**
 * Shoelace signed area in squared input units; translation reduces cancellation for tiny distant contours.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace sum on translated coordinates gives signed polygon area while reducing cancellation.
 * @evidence contracts/common.md#clear-and-simple-design Translation preserves area and keeps the input polygon untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n) arithmetic with constant auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar accumulator and an input-origin reference live during the call.
 */
export function signedArea(points: V2[]): number {
  if (points.length < 3) return 0;
  const origin: V2 = points[0];
  let area: number = 0;
  for (let i: number = 0; i < points.length; i++) {
    const a: V2 = points[i],
      b: V2 = points[(i + 1) % points.length];
    area +=
      (a[0] - origin[0]) * (b[1] - origin[1]) -
      (b[0] - origin[0]) * (a[1] - origin[1]);
  }
  return area / 2;
}
