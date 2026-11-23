import type { IAutoMovieProfilePoint } from "@automovie/interface";

/**
 * Refuse a two-dimensional construction point whose `x` or `y` is not a finite
 * number, such as a profile corner or a wall opening's origin.
 *
 * The thrown message is `<label> must be finite`, so the author learns which
 * corner of which input failed before any geometry is emitted.
 *
 * @param point Point in the builder's construction plane, in metres.
 * @param label Path of the point in the diagnostic.
 */
export const finitePoint = (
  point: IAutoMovieProfilePoint,
  label: string,
): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new Error(`${label} must be finite`);
};
