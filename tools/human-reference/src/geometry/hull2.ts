import { V2 } from "./V2.ts";

/**
 * Monotone-chain convex hull as original point indices; collinear interior points are excluded.
 *
 * @evidence contracts/common.md#principled-implementation The monotone-chain turn criterion forms a convex hull while removing collinear interior points and duplicate coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Returning original point indices preserves observation identity without copying coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) sorting and O(n) hull/index storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary index chains are released; only returned index values remain.
 */
export function hull2(points: V2[]): number[] {
  const indices: number[] = points
    .map((_p: V2, i: number): number => i)
    .sort(
      (a: number, b: number): number =>
        points[a][0] - points[b][0] || points[a][1] - points[b][1],
    );
  const unique: number[] = indices.filter(
    (i: number, k: number): boolean =>
      !k ||
      points[i][0] !== points[indices[k - 1]][0] ||
      points[i][1] !== points[indices[k - 1]][1],
  );
  if (unique.length < 3) return unique;
  const turn = (a: number, b: number, c: number): number =>
    (points[b][0] - points[a][0]) * (points[c][1] - points[a][1]) -
    (points[b][1] - points[a][1]) * (points[c][0] - points[a][0]);
  const lower: number[] = [],
    upper: number[] = [];
  for (const i of unique) {
    while (
      lower.length >= 2 &&
      turn(lower[lower.length - 2], lower[lower.length - 1], i) <= 0
    )
      lower.pop();
    lower.push(i);
  }
  for (const i of [...unique].reverse()) {
    while (
      upper.length >= 2 &&
      turn(upper[upper.length - 2], upper[upper.length - 1], i) <= 0
    )
      upper.pop();
    upper.push(i);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
