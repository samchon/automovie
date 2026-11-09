import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";

/**
 * Internal squared point-to-box lower bound for admitted nearest-query data.
 * Bounds and point use XYZ metres; cutoff is the running nonnegative squared
 * distance, with infinity admitting the complete sum. The signed-query owner
 * validates finite coordinates and representable distance arithmetic before
 * traversal; this hot primitive borrows that admission and checks no buffers.
 *
 * Terms accumulate in X/Y/Z order, matching the complete squared distance.
 * A partial sum strictly above cutoff can return immediately because adding
 * nonnegative squared terms cannot lower it. Such a return is a pruning
 * witness, not the full box distance. Equality continues, preserving equal
 * distance candidates and original triangle tie-breaking. Node ordering omits
 * cutoff and therefore receives the unchanged complete distance.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A box's squared Euclidean distance is the sum of squared component distances to its closed coordinate intervals. Nonnegative additions are monotone in binary64, so a strict partial-sum excess also implies excess of the original full sum without changing its arithmetic order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One internal lower-bound owner serves both exact node ordering and cutoff leaf pruning. The signed query supplies already admitted bounds, point and running distance; the primitive owns no topology, surface or contact policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No box inflation, geometry reduction, tolerance or caller identity participates. Only strict excess stops work; equality and every potentially nearer candidate remain eligible for the unchanged narrow phase.
 * @evidence contracts/development/common.md#meaningful-documentation States metre and squared-metre units, delegated admission, infinity/default behavior, partial versus complete returns, arithmetic order, tie preservation and the actual internal traversal consumer.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three interval distances and squared additions take constant time; strict excess after X or X+Y avoids the remaining axis arithmetic. No tree traversal or coordinate population is hidden in this primitive.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each lower bound depends on the current query point and running cutoff; immutable geometry is prepared by its caller, with no point-dependent cache here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses scalar scratch and borrows the point and box for one synchronous call, with no allocations, retained buffers or cross-query state.
 */
export function boundAutoMovieMeshQueryPoint(
  node: Readonly<Pick<IAutoMovieSpatialQueryEntry, "low" | "high">>,
  point: readonly number[],
  cutoff: number = Infinity,
): number {
  const low: number[] = node.low;
  const high: number[] = node.high;
  const x: number = Math.max(0, low[0]! - point[0]!, point[0]! - high[0]!);
  const xx: number = x * x;
  if (xx > cutoff) return xx;

  const y: number = Math.max(0, low[1]! - point[1]!, point[1]! - high[1]!);
  const xy: number = xx + y * y;
  if (xy > cutoff) return xy;

  const z: number = Math.max(0, low[2]! - point[2]!, point[2]! - high[2]!);
  return xy + z * z;
}
