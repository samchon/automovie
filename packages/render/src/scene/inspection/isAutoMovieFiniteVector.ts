import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Whether all three components of a vector are finite.
 *
 * @param point The vector to check.
 * @returns True when x, y and z are finite.
 */
export function isAutoMovieFiniteVector(point: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}
