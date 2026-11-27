import { physicalShapeGjkImplementation as implementation } from "./physicalShapeGjkImplementation";
import type { AutoMovieEnginePhysicsGjkTypes } from "../AutoMovieEnginePhysicsGjkTypes";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Closest distance and a witness on the second support-mapped solid. Uses the
 * same simplex reduction as the point/radius query. Original second-solid
 * vertices are retained alongside the simplex for its witness.
 */
export function physicalShapeGjkWitness(
  a: AutoMovieEnginePhysicsGjkTypes.Support,
  b: AutoMovieEnginePhysicsGjkTypes.Support,
  tolerance: number,
): { distance: number; point: IAutoMovieVector3 } {
  return implementation.physicalShapeGjkWitness(a, b, tolerance);
}
