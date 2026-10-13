import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/** Twice the shoelace sum, halved: positive counter-clockwise, in m². */
export const signedArea = (
  points: readonly IAutoMovieProfilePoint[],
): number => {
  let total = 0;
  for (let index = 0; index < points.length; ++index) {
    const from = points[index]!;
    const to = points[(index + 1) % points.length]!;
    total += from.x * to.y - to.x * from.y;
  }
  return total / 2;
};
