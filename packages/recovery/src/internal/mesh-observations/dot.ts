import { AutoMovieEngineSolidVector } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/* Euclidean product in the operands' common Cartesian frame. */
export function dot(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): number {
  return AutoMovieEngineSolidVector.dot(a, b);
}
