import {
  IAutoMovieServiceSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Sum consecutive 3D centre-line lengths in metres; fewer than two points yield
 * zero. Finite represented differences and total are the caller's premise.
 */
export function routeLength(segment: IAutoMovieServiceSegment): number {
  let total: number = 0;
  for (let index: number = 0; index + 1 < segment.route.length; ++index) {
    const one: IAutoMovieVector3 = segment.route[index]!;
    const next: IAutoMovieVector3 = segment.route[index + 1]!;
    total += Math.hypot(next.x - one.x, next.y - one.y, next.z - one.z);
  }
  return total;
}
