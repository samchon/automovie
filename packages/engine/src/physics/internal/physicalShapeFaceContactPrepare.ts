import { physicalShapeFaceContactImplementation as implementation } from "./physicalShapeFaceContactImplementation";
import type { AutoMovieEnginePhysicsFaceContactTypes } from "../AutoMovieEnginePhysicsFaceContactTypes";
import type { IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Prepare a face outline for repeated shape placements. The column direction
 * is expressed in face space and has nonzero Y. Its default follows the face
 * normal. A terrain owning world-horizontal bounds can pass its local world
 * vertical instead, preserving the same boundary at every height.
 */
export function physicalShapeFaceContactPrepare(
  face: IAutoMovieRigidTransform,
  outline: readonly IAutoMovieVector3[],
  column?: IAutoMovieVector3,
): (pose: IAutoMovieRigidTransform, shape: AutoMovieEnginePhysicsFaceContactTypes.Shape) => AutoMovieEnginePhysicsFaceContactTypes.IContact | undefined {
  return implementation.physicalShapeFaceContactPrepare(face, outline, column);
}
