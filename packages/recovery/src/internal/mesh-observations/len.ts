import { AutoMovieEngineSolidVector } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/* Euclidean magnitude in the operand's physical unit. */
export function len(a: AutoMovieVector3Tuple): number {
  return AutoMovieEngineSolidVector.norm(a);
}
