import { IAutoMovieServiceSegment } from "@automovie/interface";

/** Developed length of a run's authored centre line, in metres. */
export const routeLength = (segment: IAutoMovieServiceSegment): number => {
  let total = 0;
  for (let index = 0; index + 1 < segment.route.length; ++index) {
    const one = segment.route[index]!;
    const next = segment.route[index + 1]!;
    total += Math.hypot(next.x - one.x, next.y - one.y, next.z - one.z);
  }
  return total;
};
