import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/** Admits finite two-dimensional metric construction coordinates. */
export const finitePoint = (
  point: IAutoMovieProfilePoint,
  label: string,
): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new Error(`${label} must be finite`);
};
