import type { IAutoMovieSpatialQueryEntry } from "@automovie/interface";

/*
 * Internal squared point-to-box lower bound for admitted nearest-query data.
 * Bounds and point use XYZ metres; cutoff is the running nonnegative squared
 * distance, with infinity admitting the complete sum. The signed-query owner
 * validates finite coordinates and representable distance arithmetic before
 * traversal; this hot primitive borrows that admission and checks no buffers.
 *
 * Terms accumulate in X/Y/Z order, matching the complete squared distance. A
 * partial sum strictly above cutoff can return immediately because adding
 * nonnegative squared terms cannot lower it. Such a return is a pruning
 * witness, not the full box distance. Equality continues, preserving equal
 * distance candidates and original triangle tie-breaking. Node ordering omits
 * cutoff and therefore receives the unchanged complete distance.
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
