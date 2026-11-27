import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeasureContourFace64,
} from "@automovie/interface";

import { AutoMovieCurveMath64 as M } from "../../AutoMovieCurveMath64";

/*
 * Preserve the contour stage's original millimetre and metre area predicates.
 */
export function measureAutoMovieContourFace64(
  p: AutoMovieVector3Tuple,
  q: AutoMovieVector3Tuple,
  r: AutoMovieVector3Tuple,
): IAutoMovieMeasureContourFace64.IResult {
  const cross: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ) => AutoMovieVector3Tuple = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const normal: AutoMovieVector3Tuple = cross(M.sub(q, p), M.sub(r, p));
  const length: number = Math.hypot(...normal);
  const output: AutoMovieVector3Tuple[] = [p, q, r].map(
    (point: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
      M.scale(point, 0.001),
  );
  return {
    millimetresSquared: length,
    metresSquared: Math.hypot(
      ...cross(M.sub(output[1], output[0]), M.sub(output[2], output[0])),
    ),
  };
}
