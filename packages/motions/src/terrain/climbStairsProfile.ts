import type { IAutoMovieMotionHumanClimbStairsFlight } from "@automovie/interface";
import { climbStairsFlight } from "./climbStairsFlight";

/**
 * Prepare the stepped clearance profile a swinging sole point must clear.
 *
 * @param stairs The fixed flight in its starting floor frame.
 * @param near The distance either side of a nosing that receives clearance, metres.
 * @param clearance The sole point's required height above that nosing, metres.
 * @returns The same required surface height at each forward coordinate, metres.
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
