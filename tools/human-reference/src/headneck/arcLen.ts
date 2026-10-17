import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";

/**
 * Accumulates physical millimetre distance along an ordered open source curve.
 *
 * @evidence contracts/common.md#principled-implementation Euclidean segment lengths preserve the source polyline metric.
 * @evidence contracts/common.md#clear-and-simple-design A single prefix sum serves physical curve parameters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampling-index proxy replaces physical distance.
 * @evidence contracts/common.md#meaningful-documentation States world millimetres and open-curve semantics.
 * @evidence contracts/performance.md#efficient-algorithms N points require N minus one distances and an N-entry result.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure numeric operation coordinates no cached work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result storage grows with the input point count; no resources outlive it.
 */
export function arcLen(points: V3[]): number[] {
  if (!points.length) return [];
  const cumulative: number[] = [0];
  for (let i: number = 1; i < points.length; i++)
    cumulative.push(cumulative[i - 1] + dist(points[i - 1], points[i]));
  return cumulative;
}
