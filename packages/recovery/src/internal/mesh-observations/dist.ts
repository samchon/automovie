import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { len } from "./len";
import { sub } from "./sub";

/** Euclidean point distance in the points' common physical units. */
export const dist: (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
) => number = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number =>
  len(sub(a, b));
