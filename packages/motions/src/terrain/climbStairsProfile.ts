import type { IAutoMovieMotionHumanClimbStairsFlight } from "@automovie/interface";
import { climbStairsFlight } from "./climbStairsFlight";

/**
 * Prepare the stepped clearance profile a swinging sole point must clear.
 *
 * @param stairs The fixed flight in its starting floor frame.
 * @param near The distance either side of a nosing that receives clearance, metres.
 * @param clearance The sole point's required height above that nosing, metres.
 * @returns The same required surface height at each forward coordinate, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed architecture, floor frame, clearance band and metre-valued query/result.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original surface under the point and maximum of both millimetre-sided samples at each nearby nosing plus authored clearance; binary selection omits only edges whose original distance comparison cannot hold.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed nosing heights precede a lower-bound lookup and a scan of only the overlapping edge bands.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original inclusive absolute-distance predicate, straddling offsets, surface rule and clearance; no edge or sole point is sampled less often.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation/storage in tread count and logarithmic edge selection plus the overlapping bands per profile read, replacing the full edge scan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed flight and clearance band determine each edge and its height once; the reader evaluates every actual sole coordinate and stores no queried height.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader owns one edge record per tread until its climb plan releases it, without a sample history or external handle.
 */
export function climbStairsProfile(
  stairs: IAutoMovieMotionHumanClimbStairsFlight.IFlight,
  near: number,
  clearance: number,
): (z: number) => number {
  const surface: ReturnType<typeof climbStairsFlight.prepareSurface> = climbStairsFlight.prepareSurface(stairs);
  const edges: { z: number; height: number }[] = Array.from(
    { length: stairs.count },
    (_: unknown, i: number): { z: number; height: number } => {
      const z: number = stairs.first + i * stairs.tread;
      return {
        z,
        height: Math.max(
          surface(z - 0.001),
          surface(z + 0.001),
        ) + clearance,
      };
    },
  );
  return (z: number): number => {
    let height: number = surface(z);
    let low: number = 0;
    let high: number = edges.length;
    while (low < high) {
      const middle: number = (low + high) >>> 1;
      if (z - edges[middle]!.z > near) low = middle + 1;
      else high = middle;
    }
    for (let i: number = low; i < edges.length; i++) {
      const edge: (typeof edges)[number] = edges[i]!;
      if (Math.abs(z - edge.z) <= near)
        height = Math.max(height, edge.height);
      else if (edge.z > z) break;
    }
    return height;
  };
}
