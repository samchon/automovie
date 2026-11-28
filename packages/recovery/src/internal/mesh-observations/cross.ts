import { AutoMovieEngineSolidVector } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/* Right-handed cross product in the common Cartesian frame. */
export function cross(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return AutoMovieEngineSolidVector.cross(a, b);
}
