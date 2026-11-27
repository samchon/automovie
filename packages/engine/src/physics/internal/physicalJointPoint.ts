import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/*
 * Locate the actual joint anchor even when a primitive's bone origin is its
 * solid centre.
 */
export function physicalJointPoint(
  profile: IAutoMoviePhysicalProfile,
  bone: string,
  targets: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IAutoMovieVector3 {
  const pose: IAutoMovieRigidTransform | undefined = targets[bone];
  if (!pose) throw new Error(`Physical joint point missing segment ${bone}`);
  const joint: IAutoMoviePhysicalJoint | undefined = profile.joints.find(
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
