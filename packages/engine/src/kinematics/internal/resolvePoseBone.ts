import type {
  IAutoMovieBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/**
 * Compose one bone through the same parent-first FK used by resolvePose.
 * Rotations must be unit quaternions; rest scale is ignored. All returned
 * transforms are newly owned, including when an input is an identity.
 */
export function resolvePoseBone(
  bone: IAutoMovieBone,
  parentRotation: IAutoMovieQuaternion,
  parentPosition: IAutoMovieVector3,
  articulation: IAutoMovieQuaternion,
): IAutoMovieResolvedBone {
  const localRotation: IAutoMovieQuaternion = Quaternion.multiply(
    bone.rest.rotation,
    articulation,
  );
  const worldRotation: IAutoMovieQuaternion = Quaternion.multiply(
    parentRotation,
    localRotation,
  );
  const worldPosition: IAutoMovieVector3 = Vector3.add(
    parentPosition,
    Quaternion.rotateVector(parentRotation, bone.rest.translation),
  );
  return { bone: bone.bone, localRotation, worldPosition, worldRotation };
}
