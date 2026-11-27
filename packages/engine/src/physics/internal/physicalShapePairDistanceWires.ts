import { physicalShapePairDistanceImplementation as implementation } from "./physicalShapePairDistanceImplementation";
import type { IAutoMoviePhysicalShape } from "@automovie/interface";
import type { AutoMovieEnginePhysicsPairDistanceTypes } from "../AutoMovieEnginePhysicsPairDistanceTypes";

/*
 * The wire frame of one shape: a sphere's centre and a capsule's axis widened
 * by their radius, a box's and a hull's edges widened by nothing. A hull's
 * edges are kept per point list.
 * Parameter shape: The shape.
 * Returns: Its wire frame, shape-local metres.
 */
export function physicalShapePairDistanceWires(
  shape: IAutoMoviePhysicalShape,
): AutoMovieEnginePhysicsPairDistanceTypes.IWires {
  return implementation.physicalShapePairDistanceWires(shape);
}
