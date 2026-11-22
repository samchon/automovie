import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { PhysicalRotationVector as Rotation } from "./PhysicalRotationVector";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";

/**
 * Post-stabilize a returning segment's parent-relative state onto its
 * joint's limits (Cline and Pai 2003, "Post-stabilization for rigid body
 * simulation with contact and constraints", ICRA): finite solver iterations
 * leave a joint a small drift past its limit box, and the return starts from
 * the state projected back onto it, each limited coordinate to its nearest
 * bound in closed form (`projectPhysicalJointRotation`). The origin and the
 * velocities are kept.
 *
 * @param drifted The solved parent-relative state.
 * @param joint The segment's joint; none for the root.
 * @returns The projected state and the radians the joint rotation moved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the drift removed, the projection, what is kept and the returned angle.
 * @evidence contracts/development/implementation.md#principled-implementation Post-stabilization projects a drifted state onto the constraint manifold after the step; for box limits on independent coordinates the projection clamps each coordinate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame change into the joint, the engine's projection, and back.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the rotation is projected; a state within its limits passes unchanged with angle zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per segment.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh state; retains nothing.
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

/** Companion types of {@link stabilizePhysicalJointReturn}. */
export namespace stabilizePhysicalJointReturn {
  /** A parent-relative state projected onto its joint's limits, and the projection's angle. */
  export interface IResult {
    /** The projected state; the drifted one unchanged for a segment without a joint. */
    result: IAutoMovieSamplePhysicalTarget.IResult;

    /** Radians the joint rotation moved; zero within the limits or without a joint. */
    angle: number;
  }
}
