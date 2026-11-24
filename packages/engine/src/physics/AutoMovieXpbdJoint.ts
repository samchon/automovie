import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * One articulation of the engine's extended position-based dynamics world
 * (`AutoMovieXpbdWorld`): the two bodies it joins, its anchor frames on each,
 * its rotational limits and one velocity motor per free axis.
 *
 * The anchors coincide (a ball joint's attachment, Mueller et al. 2020, section
 * 3.3.1). The rotation of the child's anchor frame relative to the parent's is
 * held inside the profile's limits: its free axes' coordinates `2 atan(q.axis /
 * w)` inside their boxes and its locked axes' at zero
 * (`projectPhysicalJointRotation`), and inside its clinical swing-twist limit
 * when it declares one. A motor drives its axis's relative angular velocity
 * toward a speed through implicit damping up to a torque cap.
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
   */
  public parentFrame(): IAutoMovieRigidTransform {
    return this.joint.parentFrame;
  }

  /**
   * The anchor frame on the child, in the child's body frame.
   *
   * @returns The profile joint's own record, not a copy; metres.
   */
  public childFrame(): IAutoMovieRigidTransform {
    return this.joint.childFrame;
  }
}

/** Companion types of {@link AutoMovieXpbdJoint}. */
export namespace AutoMovieXpbdJoint {
  /** One free axis's velocity motor. */
  export interface IMotor {
    /** Target relative angular speed about the axis, radians per second. */
    speed: number;

    /** Implicit damping, newton metre seconds per radian. */
    damping: number;

    /** Torque cap toward the axis's positive direction, newton metres. */
    maximumTorque: number;

    /**
     * Torque cap toward the axis's negative direction, newton metres;
     * `maximumTorque` both ways when absent. A joint whose two directions
     * differ in strength bounds each one by its own (Herzog et al. 2016,
     * Section 2.1).
     */
    reverseTorque?: number;

    /**
     * The relative speed the PD alone asks, without its feed-forward torque,
     * radians per second: the posture a support cascade moves the joint toward
     * (`solveXpbdSupportCascade`); `speed` when absent.
     */
    target?: number;
  }

  /**
   * A motor's cap on an impulse's direction over a substep: the positive
   * direction's for a positive impulse, the negative direction's otherwise.
   *
   * @param motor The motor.
   * @param impulse The impulse whose direction picks the cap, newton metre
   *   seconds.
   * @param h The substep, seconds.
   * @returns The cap, newton metre seconds, never negative.
   */
  export function cap(motor: IMotor, impulse: number, h: number): number {
    return (
      (impulse < 0
        ? (motor.reverseTorque ?? motor.maximumTorque)
        : motor.maximumTorque) * h
    );
  }
}
