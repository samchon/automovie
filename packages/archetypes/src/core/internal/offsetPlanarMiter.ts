import type { IAutoMovieProfilePoint } from "@automovie/interface";

/*
 * Meet the two incident lines at equal offset along their unit normals.
 * Their sum has the same projection, 1 + cos(turn), onto either normal.
 * Each caller owns the orientation and admissibility of its edges.
 */
export function offsetPlanarMiter(
  point: IAutoMovieProfilePoint,
  before: IAutoMovieProfilePoint,
  after: IAutoMovieProfilePoint,
  distance: number,
): IAutoMovieProfilePoint {
  const scale: number =
    distance / (1 + before.x * after.x + before.y * after.y);
  return {
    x: point.x + (before.x + after.x) * scale,
    y: point.y + (before.y + after.y) * scale,
  };
}
