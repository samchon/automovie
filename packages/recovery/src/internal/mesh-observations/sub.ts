import { AutoMovieEngineSolidVector } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/* Subtract two same-chart physical tuples. */
export function sub(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return AutoMovieEngineSolidVector.sub(a, b);
}
