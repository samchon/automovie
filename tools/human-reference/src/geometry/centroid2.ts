import { V2 } from "./V2.ts";

/**
 * Area centroid of a planar closed polygon; near-zero area falls back to the vertex mean explicitly.
 *
 * @evidence contracts/common.md#principled-implementation The translated shoelace first moment computes polygon area centroid, with a declared vertex-mean fallback for nearly zero area.
 * @evidence contracts/common.md#clear-and-simple-design The degeneracy rule is centralized beside the moment calculation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(n) arithmetic with constant auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new pair and retains no polygon data.
 */
export function centroid2(points: V2[]): V2 {
  if (!points.length) throw new Error("Empty polygon has no centroid");
  const origin: V2 = points[0];
  let area: number = 0,
    x: number = 0,
    y: number = 0;
  for (let i: number = 0; i < points.length; i++) {
    const a: V2 = [points[i][0] - origin[0], points[i][1] - origin[1]];
    const b: V2 = [
      points[(i + 1) % points.length][0] - origin[0],
      points[(i + 1) % points.length][1] - origin[1],
    ];
    const determinant: number = a[0] * b[1] - b[0] * a[1];
    area += determinant;
    x += (a[0] + b[0]) * determinant;
    y += (a[1] + b[1]) * determinant;
  }
  if (Math.abs(area) < 1e-12)
    return [
      points.reduce((sum: number, p: V2): number => sum + p[0], 0) /
        points.length,
      points.reduce((sum: number, p: V2): number => sum + p[1], 0) /
        points.length,
    ];
  return [origin[0] + x / (3 * area), origin[1] + y / (3 * area)];
}
