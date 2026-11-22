import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * One articulation of the engine's extended position-based dynamics world
 * (`AutoMovieXpbdWorld`): the two bodies it joins, its anchor frames on
 * each, its rotational limits and one velocity motor per free axis.
 *
 * The anchors coincide (a ball joint's attachment, Mueller et al. 2020,
 * section 3.3.1). The rotation of the child's anchor frame relative to the
 * parent's is held inside the profile's limits: its free axes' coordinates
 * `2 atan(q.axis / w)` inside their boxes and its locked axes' at zero
 * (`projectPhysicalJointRotation`), and inside its clinical swing-twist
 * limit when it declares one. A motor drives its axis's relative angular
 * velocity toward a speed through implicit damping up to a torque cap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the attachment, the two limit forms and the motor law.
 * @evidence contracts/development/design.md#principled-representation The profile's own joint record carries the frames, axes and limits; motors hold a speed in radians per second, a damping in newton metre seconds per radian and a cap in newton metres per free axis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the world's joint solve and the simulation's motor configuration use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's joint record instead of a solver-specific copy.
 */
export class AutoMovieXpbdJoint {
  /** Its handle, unique in its world. */
  public readonly handle: number;

  /** The parent body. */
  public readonly parent: AutoMovieXpbdBody;

  /** The child body. */
  public readonly child: AutoMovieXpbdBody;

  /** The profile's joint: frames, axes and limits. */
  public readonly joint: IAutoMoviePhysicalJoint;
  /** Velocity motors by free axis. */
  public readonly motors: Map<string, AutoMovieXpbdJoint.IMotor> = new Map();

  /**
   * Join two bodies.
   *
   * @param handle Its handle, unique in its world.
   * @param parent The parent body.
   * @param child The child body.
   * @param joint The profile's joint: frames, axes and limits.
   */
  public constructor(
    handle: number,
    parent: AutoMovieXpbdBody,
    child: AutoMovieXpbdBody,
    joint: IAutoMoviePhysicalJoint,
  ) {
    this.handle = handle;
    this.parent = parent;
    this.child = child;
    this.joint = joint;
  }

  /**
   * The anchor frame on the parent, in the parent's body frame.
   *
   * @returns The profile joint's own record, not a copy; metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and that the record is shared.
   * @evidence contracts/development/implementation.md#principled-implementation The anchor frame is fixed by the profile joint for the joint's lifetime.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A read of fixed state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the joint's record; retains nothing new.
   */
  public parentFrame(): IAutoMovieRigidTransform {
    return this.joint.parentFrame;
  }

  /**
   * The anchor frame on the child, in the child's body frame.
   *
   * @returns The profile joint's own record, not a copy; metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, unit and that the record is shared.
   * @evidence contracts/development/implementation.md#principled-implementation The anchor frame is fixed by the profile joint for the joint's lifetime.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One field read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A read of fixed state; nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the joint's record; retains nothing new.
   */
  public childFrame(): IAutoMovieRigidTransform {
    return this.joint.childFrame;
  }
}

/** Companion types of {@link AutoMovieXpbdJoint}. */
export namespace AutoMovieXpbdJoint {
  /**
   * One free axis's velocity motor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the speed, damping and cap.
   * @evidence contracts/development/design.md#principled-representation Radians per second, newton metre seconds per radian and newton metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Set by the joint motor configuration and read by the solver's motors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One record per free axis.
   */
  export interface IMotor {
    /** Target relative angular speed about the axis, radians per second. */
    speed: number;

    /** Implicit damping, newton metre seconds per radian. */
    damping: number;

    /** Torque cap, newton metres. */
    maximumTorque: number;
  }
}
