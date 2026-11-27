import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";

/*
 * Parent-frame to child-frame rotation of one joint in a pose record, as the
 * native motor owner reads it.
 */
export function physicalJointRelativeRotation(
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  joint: IAutoMoviePhysicalJoint,
): IAutoMovieRigidTransform["rotation"] {
  return AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.inverse(
      AutoMovieEngineQuaternion.multiply(
        poses[joint.parent]!.rotation,
        joint.parentFrame.rotation,
      ),
    ),
    AutoMovieEngineQuaternion.multiply(
      poses[joint.child]!.rotation,
      joint.childFrame.rotation,
    ),
  );
}
