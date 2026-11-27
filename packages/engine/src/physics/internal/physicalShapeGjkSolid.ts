import { physicalShapeGjkImplementation as implementation } from "./physicalShapeGjkImplementation";
import type { AutoMovieEnginePhysicsGjkTypes } from "../AutoMovieEnginePhysicsGjkTypes";
import type { IAutoMoviePhysicalShape, IAutoMovieRigidTransform } from "@automovie/interface";

/**
 * A placed shape as a solid: a sphere's centre, a capsule's axis ends, a
 * box's corners or a hull's vertices in the world, widened by the sphere's or
 * the capsule's radius.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The shape.
 * @returns The solid.
 */
export function physicalShapeGjkSolid(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): AutoMovieEnginePhysicsGjkTypes.ISolid {
  return implementation.physicalShapeGjkSolid(pose, shape);
}
