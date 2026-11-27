import type {
  IAutoMovieBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
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
  const localRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    bone.rest.rotation,
    articulation,
  );
  const worldRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    parentRotation,
    localRotation,
  );
  const worldPosition: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    parentPosition,
    AutoMovieEngineQuaternion.rotateVector(parentRotation, bone.rest.translation),
  );
  return { bone: bone.bone, localRotation, worldPosition, worldRotation };
}
