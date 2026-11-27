import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMoviePlaneFrame,
} from "@automovie/interface";

import { dot } from "./dot";
import { sub } from "./sub";

/*
 * Projects a point into the plane's physical u/v coordinates; the normal
 * residual is discarded.
 */
export const to2: (
  plane: IAutoMoviePlaneFrame,
  point: AutoMovieVector3Tuple,
) => AutoMovieVector2Tuple = (
  plane: IAutoMoviePlaneFrame,
  point: AutoMovieVector3Tuple,
): AutoMovieVector2Tuple => {
  const relative: AutoMovieVector3Tuple = sub(point, plane.origin);
  return [dot(relative, plane.u), dot(relative, plane.v)];
};
