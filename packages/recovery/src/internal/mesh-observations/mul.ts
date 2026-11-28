import { AutoMovieEngineSolidVector } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/* Scale a physical tuple in its own Cartesian frame. */
export function mul(
  a: AutoMovieVector3Tuple,
  scale: number,
): AutoMovieVector3Tuple {
  return AutoMovieEngineSolidVector.scale(a, scale);
}
