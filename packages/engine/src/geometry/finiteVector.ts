import { IAutoMovieVector3 } from "@automovie/interface";

/** Admits finite three-dimensional metric construction coordinates. */
export const finiteVector = (point: IAutoMovieVector3, label: string): void => {
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new Error(`${label} must be finite`);
};
