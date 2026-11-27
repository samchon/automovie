import type {
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Resolve an authored support point from its owning bone, including rigs
 * without a separate foot bone.
 */
export function physicalSupportPoint(
  pose: IAutoMovieRigidTransform,
  localPoint?: IAutoMovieVector3,
): IAutoMovieVector3 {
  return localPoint
    ? AutoMovieEngineVector3.add(
        pose.position,
        AutoMovieEngineQuaternion.rotateVector(pose.rotation, localPoint),
      )
    : { ...pose.position };
}
