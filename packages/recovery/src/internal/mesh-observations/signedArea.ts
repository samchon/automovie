import type { AutoMovieVector2Tuple } from "@automovie/interface";

/**
 * Shoelace signed area in squared input units; translation reduces cancellation
 * for tiny distant contours.
 */
export function signedArea(points: AutoMovieVector2Tuple[]): number {
  if (points.length < 3) return 0;
  const origin: AutoMovieVector2Tuple = points[0];
  let area: number = 0;
  for (let i: number = 0; i < points.length; i++) {
    const a: AutoMovieVector2Tuple = points[i],
      b: AutoMovieVector2Tuple = points[(i + 1) % points.length];
    area +=
      (a[0] - origin[0]) * (b[1] - origin[1]) -
      (b[0] - origin[0]) * (a[1] - origin[1]);
  }
  return area / 2;
}
