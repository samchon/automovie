import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";

/**
 * Measures a source polyline in millimetres, optionally including its closing edge.
 *
 * @evidence contracts/common.md#principled-implementation Sums Euclidean distances in the unchanged world frame.
 * @evidence contracts/common.md#clear-and-simple-design The explicit closure flag owns the final edge's meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No convex hull or index-distance measurement substitutes for skin arclength.
 * @evidence contracts/common.md#meaningful-documentation States units and whether the implicit closing edge is included.
 * @evidence contracts/performance.md#efficient-algorithms N points require one linear pass and constant temporary storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure measurement retains no request state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns no handles, running tasks or retained arrays.
 */
export function polyLen(points: V3[], closed: boolean = false): number {
  let length: number = 0;
  for (let i: number = 1; i < points.length; i++)
    length += dist(points[i - 1], points[i]);
  if (closed && points.length > 2)
    length += dist(points[points.length - 1], points[0]);
  return length;
}
