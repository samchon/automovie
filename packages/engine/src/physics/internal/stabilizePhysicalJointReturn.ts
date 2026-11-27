import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { PhysicalRotationVector as Rotation } from "../PhysicalRotationVector";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";

/*
 * Post-stabilize a returning segment's parent-relative state onto its joint's
 * limits (Cline and Pai 2003, "Post-stabilization for rigid body simulation
 * with contact and constraints", ICRA): finite solver iterations leave a joint
 * a small drift past its limit box, and the return starts from the state
 * projected back onto it, each limited coordinate to its nearest bound in
 * closed form (`projectPhysicalJointRotation`). The origin and the velocities
 * are kept.
 * Parameter drifted: The solved parent-relative state.
 * Parameter joint: The segment's joint; none for the root.
 * Returns: The projected state and the radians the joint rotation moved.
 */
export function stabilizePhysicalJointReturn(
  drifted: IAutoMovieSamplePhysicalTarget.IResult,
  joint: IAutoMoviePhysicalJoint | undefined,
): stabilizePhysicalJointReturn.IResult {
  if (joint === undefined) return { result: drifted, angle: 0 };
  const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(joint.parentFrame.rotation),
    Quaternion.multiply(drifted.pose.rotation, joint.childFrame.rotation),
  );
  const admitted: IAutoMovieRigidTransform["rotation"] =
    projectPhysicalJointRotation(joint, rotation);
  return {
    result: {
      ...drifted,
      pose: {
        position: drifted.pose.position,
        rotation: Quaternion.multiply(
          joint.parentFrame.rotation,
          Quaternion.multiply(
            admitted,
            Quaternion.inverse(joint.childFrame.rotation),
          ),
        ),
      },
    },
    angle: Vector3.length(
      Rotation.log(Quaternion.multiply(admitted, Quaternion.inverse(rotation))),
    ),
  };
}

/*
 * Companion types of stabilizePhysicalJointReturn.
 */
export namespace stabilizePhysicalJointReturn {
  /*
   * A parent-relative state projected onto its joint's limits, and the
   * projection's angle.
   */
  export interface IResult {
    /*
     * The projected state; the drifted one unchanged for a segment without a
     * joint.
     */
    result: IAutoMovieSamplePhysicalTarget.IResult;

    /*
     * Radians the joint rotation moved; zero within the limits or without a
     * joint.
     */
    angle: number;
  }
}
