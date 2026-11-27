import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";

/*
 * Parent-frame to child-frame rotation of one joint in a pose record, as the
 * native motor owner reads it.
 */
export function physicalJointRelativeRotation(
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  joint: IAutoMoviePhysicalJoint,
): IAutoMovieRigidTransform["rotation"] {
  return Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(
        poses[joint.parent]!.rotation,
        joint.parentFrame.rotation,
      ),
    ),
    Quaternion.multiply(
      poses[joint.child]!.rotation,
      joint.childFrame.rotation,
    ),
  );
}
