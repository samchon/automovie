import { Point } from "./Point";


/** Unsigned area of a polygon. */
export const polygonArea = (points: readonly Point[]): number => Math.abs(
  points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length]!;
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0)
) / 2;
