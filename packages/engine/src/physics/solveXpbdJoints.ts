import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { limitPhysicalSwingTwist } from "./limitPhysicalSwingTwist";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";

/**
 * The joint phase of one extended position-based dynamics step (Mueller,
 * Macklin, Chentanez, Jeschke and Kim 2020, section 3.3 and 3.4).
 *
 * `positions` closes each joint's anchor gap with a hard point constraint solved as one 3x3 block, then turns the child toward the nearest admitted rotation of its anchor frame relative to the parent's, again as one block: the box of the profile's free
 * axes, locked axes held at zero (`projectPhysicalJointRotation`), and the
 * clinical swing-twist limit where the joint declares one (`limitPhysicalSwingTwist`). Solving each attachment's rows together removes the whole linearized error in one correction, whatever the inertia's anisotropy, where a scalar constraint along the error direction converges only over passes. `motors` drives each free axis's relative angular
 * velocity toward its motor's speed by implicit damping,
 * `lambda = h c (s - v) / (1 + h c w)` with `w` the pair's angular inverse
 * mass about the axis, the backward-Euler damper, capped at the motor's
 * torque times the substep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the attachment, both limits, the motor law and its cap.
 * @evidence contracts/development/design.md#principled-representation A namespace over the world's joints; angles in radians, impulses in newton metre seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieXpbdWorld.step` drives both phases.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Limits and gains are the profile's and the motors'; nothing is tuned here.
 */
export namespace solveXpbdJoints {
  /**
   * One position pass over the joints.
   * @param joints The joints, in creation order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the attachment and both limit forms.
   * @evidence contracts/development/implementation.md#principled-implementation Block point and rotation corrections toward the anchor and the admitted rotation (projectPhysicalJointRotation, limitPhysicalSwingTwist).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over joints: anchor, then rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Joints between two kinematic bodies are skipped; limits are the profile's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in joints per pass.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each pass reads the current poses; nothing carries over.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the bodies it is given; allocates only transient vectors.
   */
  export function positions(joints: readonly AutoMovieXpbdJoint[]): void {
    for (const joint of joints) {
      const parent: AutoMovieXpbdBody = joint.parent;
      const child: AutoMovieXpbdBody = joint.child;
      if (!parent.dynamic && !child.dynamic) continue;

      // The anchors coincide.
      const pf: IAutoMovieRigidTransform = joint.parentFrame();
      const cf: IAutoMovieRigidTransform = joint.childFrame();
      const armP: IAutoMovieVector3 = anchorArm(parent, pf.position);
      const armC: IAutoMovieVector3 = anchorArm(child, cf.position);
      const gap: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(parent.center, armP),
        Vector3.add(child.center, armC),
      );
      if (Vector3.length(gap) > 0)
        AutoMovieXpbdMath.point(child, parent, gap, armC, armP);

      // The child's anchor frame turns into the admitted rotation.
      const base: IAutoMovieQuaternion = Quaternion.multiply(
        parent.orientation,
        pf.rotation,
      );
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(base),
        Quaternion.multiply(child.orientation, cf.rotation),
      );
      let admitted: IAutoMovieQuaternion = projectPhysicalJointRotation(
        joint.joint,
        relative,
      );
      if (joint.joint.swingTwist !== undefined)
        admitted = limitPhysicalSwingTwist(joint.joint.swingTwist, admitted);
      const correction: IAutoMovieVector3 = Quaternion.rotateVector(
        base,
        PhysicalRotationVector.log(
          Quaternion.multiply(admitted, Quaternion.inverse(relative)),
        ),
      );
      if (Vector3.length(correction) > 0)
        AutoMovieXpbdMath.rotation(child, parent, correction);
    }
  }

  /**
   * The velocity pass of the joints' motors.
   *
   * @param joints The joints, in creation order.
   * @param h The substep, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the implicit damper and its cap.
   * @evidence contracts/development/implementation.md#principled-implementation Backward-Euler damper lambda = h c (s - v) / (1 + h c w), capped at the torque times h.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over joints and their motors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A motor without damping or torque is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in motors.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Motors are reset by their owner each step.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the bodies it is given; allocates only transient vectors.
   */
  export function motors(
    joints: readonly AutoMovieXpbdJoint[],
    h: number,
  ): void {
    for (const joint of joints) {
      if (joint.motors.size === 0) continue;
      const parent: AutoMovieXpbdBody = joint.parent;
      const child: AutoMovieXpbdBody = joint.child;
      const base: IAutoMovieQuaternion = Quaternion.multiply(
        parent.orientation,
        joint.parentFrame().rotation,
      );
      for (const [name, motor] of joint.motors) {
        if (!(motor.damping > 0) || !(motor.maximumTorque > 0)) continue;
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          base,
          UNIT[name]!,
        );
        const relative: number = Vector3.dot(
          Vector3.subtract(child.angularVelocity, parent.angularVelocity),
          axis,
        );
        const weight: number =
          AutoMovieXpbdMath.weight(child, axis) +
          AutoMovieXpbdMath.weight(parent, axis);
        if (!(weight > 0)) continue;
        const cap: number = motor.maximumTorque * h;
        const lambda: number = Math.max(
          -cap,
          Math.min(
            cap,
            (h * motor.damping * (motor.speed - relative)) /
              (1 + h * motor.damping * weight),
          ),
        );
        AutoMovieXpbdMath.spin(child, parent, Vector3.scale(axis, lambda));
      }
    }
  }

  /** A body-frame anchor's world arm from the body's centre. */
  function anchorArm(
    body: AutoMovieXpbdBody,
    anchor: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      body.orientation,
      Vector3.subtract(anchor, body.centerOfMass),
    );
  }

  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
