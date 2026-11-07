import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Resolve an authored support point from its owning bone, including rigs without a separate foot bone. */
export function physicalSupportPoint(
  pose: P.ITransform,
  localPoint?: IAutoMovieVector3,
): IAutoMovieVector3 {
  return localPoint
    ? Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, localPoint),
      )
    : { ...pose.position };
}
