import { IAutoMovieServiceSegment } from "@automovie/interface";

/**
 * Developed length of a run's authored centre line, in metres.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `routeLength` measures the installed metre length of an authored run through all horizontal, vertical, and diagonal legs.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `routeLength` sums the Euclidean distance between each adjacent pair of three-dimensional route points.
 */
export const routeLength = (segment: IAutoMovieServiceSegment): number => {
  let total = 0;
  for (let index = 0; index + 1 < segment.route.length; ++index) {
    const one = segment.route[index]!;
    const next = segment.route[index + 1]!;
    total += Math.hypot(next.x - one.x, next.y - one.y, next.z - one.z);
  }
  return total;
};
