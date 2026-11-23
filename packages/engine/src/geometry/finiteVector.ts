import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Refuse a three-dimensional construction vector whose `x`, `y` or `z` is not
 * a finite number, such as a path point, a polyhedron corner or a mesh
 * transform's translation or scale.
 *
 * The thrown message is `<label> must be finite`, naming the input before
 * any buffer is written.
 *
 * @param point Vector to admit.
 * @param label Path of the vector in the diagnostic.
 */
export const finiteVector = (point: IAutoMovieVector3, label: string): void => {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  )
    throw new Error(`${label} must be finite`);
};
