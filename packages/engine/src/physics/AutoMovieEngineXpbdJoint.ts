import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { AutoMovieEngineXpbdBody } from "./AutoMovieEngineXpbdBody";
import type { AutoMovieEngineXpbdSupportRows } from "./AutoMovieEngineXpbdSupportRows";
import type { AutoMovieEngineXpbdWorld } from "./AutoMovieEngineXpbdWorld";
import { solveXpbdJoints as Joints } from "./internal/solveXpbdJoints";

/**
 * One articulation of the engine's extended position-based dynamics world
 * (`AutoMovieEngineXpbdWorld`): the two bodies it joins, its anchor frames on each,
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
export class AutoMovieEngineXpbdJoint {
  /** Its handle, unique in its world. */
  public readonly handle: number;

  /** The parent body. */
  public readonly parent: AutoMovieEngineXpbdBody;

  /** The child body. */
  public readonly child: AutoMovieEngineXpbdBody;

  /** The profile's joint: frames, axes and limits. */
  public readonly joint: IAutoMoviePhysicalJoint;
  /** Velocity motors by free axis. */
  public readonly motors: Map<string, AutoMovieEngineXpbdJoint.IMotor> = new Map();

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
    parent: AutoMovieEngineXpbdBody,
    child: AutoMovieEngineXpbdBody,
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

/** Companion types of {@link AutoMovieEngineXpbdJoint}. */
export namespace AutoMovieEngineXpbdJoint {
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

  /**
   * One position pass over the joints: each articulation's joints projected
   * together by the tree's direct Newton solve (`solveXpbdJointTree`), then
   * each joint outside the forest (closing a loop, or with a kinematic child)
   * by its own block correction.
   *
   * @param joints The joints, in creation order.
   * @param h The substep, seconds.
   */
  export function positions(
    joints: readonly AutoMovieEngineXpbdJoint[],
    h: number,
  ): void {
    Joints.positions(joints, h);
  }

  /**
   * The velocity pass of the joints' motors. Every articulation's motors are
   * solved at once over its tree (`solveXpbdArticulation`). A joint outside the
   * forest (closing a loop, or with a kinematic child) has its motor rows
   * solved together with its own attachment's three velocity rows: unknowns are
   * the attachment impulse `p` and one angular impulse `mu_i` per motor axis
   * `a_i`, the attachment rows ask the anchors' relative velocity to vanish,
   * and each motor row is the backward-Euler damper `mu_i = h c_i (s_i - v_i')`
   * on the axis's relative angular velocity after the impulse, `v_i' + mu_i /
   * (h c_i) = s_i`. A motor whose impulse exceeds its cap `tau_i h` is held at
   * the cap and the rest re-solved.
   *
   * @param joints The joints, in creation order.
   * @param h The substep, seconds.
   * @param contacts The step's contacts, which hold each tree at its supports.
   * @param tasks The root tasks the trees' supports should meet, by root body.
   * @param warm Each tree's warm start for its supports' cascade, by root body,
   *   kept across steps.
   */
  export function motors(
    joints: readonly AutoMovieEngineXpbdJoint[],
    h: number,
    contacts: readonly AutoMovieEngineXpbdWorld.IContact[],
    tasks: ReadonlyMap<AutoMovieEngineXpbdBody, AutoMovieEngineXpbdWorld.IRootTask>,
    warm: Map<AutoMovieEngineXpbdBody, AutoMovieEngineXpbdSupportRows.IWarm>,
  ): void {
    Joints.motors(joints, h, contacts, tasks, warm);
  }
}
