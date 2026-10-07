import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";

/** Project a source-local site/orientation through the one actual source frame; shared by humanoid and toe-ray consumers. */
export function projectHumanBodySourceFrame(
  frame: IAutoMovieHumanBodyBoneWorldRest,
  origin: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieHumanBodyBoneWorldRest {
  return {
    position: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, origin),
    ),
    rotation: Quaternion.normalize(
      Quaternion.multiply(frame.rotation, rotation),
    ),
  };
}
