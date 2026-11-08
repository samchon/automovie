import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Locate the actual joint anchor even when a primitive's bone origin is its solid centre. */
export function physicalJointPoint(
  profile: P,
  bone: string,
  targets: Readonly<Record<string, P.ITransform>>,
): IAutoMovieVector3 {
  const pose: P.ITransform | undefined = targets[bone];
  if (!pose) throw new Error(`Physical joint point missing segment ${bone}`);
  const joint: P.IJoint | undefined = profile.joints.find(
    (candidate: (typeof profile.joints)[number]): boolean =>
      candidate.child === bone,
  );
  return joint
    ? Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, joint.childFrame.position),
      )
    : { ...pose.position };
}
