import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";

/** One joint's motor command. One axis's native velocity-motor command. */
export namespace IAutoMoviePhysicalJointMotorCommand {
  /** One joint's motor command. */
  export interface IOutput {
    /** One velocity-motor command per declared axis, in declaration order. */
    axes: IAutoMoviePhysicalJointMotorCommand.IAxis[];

    /** Norm of the declared axes' geodesic error, radians. */
    error: number;

    /** Axes whose forecast demand exceeds their torque cap. */
    saturated: ("x" | "y" | "z")[];
  }

  /** One axis's native velocity-motor command. */
  export interface IAxis {
    /** Joint-frame axis. */
    axis: "x" | "y" | "z";

    /** Target relative angular speed, rad/s. */
    speed: number;

    /** Implicit motor damping, N m s/rad. */
    damping: number;

    /** Motor torque cap, N m; zero for an inactive motor. */
    maximumTorque: number;
  }

  /**
   * The bounded quaternion PD command of one joint for the native implicit
   * velocity motors.
   *
   * A native positional motor measures 2 asin(qi) while using the plain joint
   * axis as its Jacobian, which disagrees under compound rotations. The error
   * is therefore the geodesic rotation vector of target times inverse current,
   * on the short arc. Each axis drives an implicit velocity motor with damping
   * d = (c + k dt) strength-scaled plus passive damping and target speed (k e +
   * c_active w_target + f strength) / d_active+passive, the backward-Euler form
   * of PD with stiffness k = stiffness strength. With positive strength the
   * requested velocity is projected into the joint's twist-limit box for the
   * next substep. The cap is the axis torque when any gain is active and zero
   * otherwise. Saturation is a demand forecast |d (speed - velocity)| > cap,
   * because the native SDK exposes no solved motor impulse.
   */
  export type IInput = {
    /** Joint whose declared axes, gains and caps are commanded. */ joint: IAutoMoviePhysicalJoint;
    /** Current child-relative joint rotation. */ current: IAutoMovieQuaternion;
    /** Target child-relative joint rotation. */ target: IAutoMovieQuaternion;
    /** Current relative angular velocity in the joint frame, rad/s. */ velocity: IAutoMovieVector3;
    /** Target relative angular velocity in the joint frame, rad/s. */ targetVelocity: IAutoMovieVector3;
    /** Tracking fraction in [0, 1]. */ strength: number;
    /** Optional joint-frame torque feed-forward, N m, scaled by strength. */ feedForward?: IAutoMovieVector3;
    /** Native substep, seconds; positive. */ timestep: number;
    /** Fraction of the declared stiffness kept, in [0, 1]; a stance chain driven by its allocated wrench keeps only a small posture bias. Absent keeps all of it. */ stiffnessScale?: number;
    /** Fraction of the declared active damping kept, in (0, 1]; a held stance ankle keeps a minimal share so its explicit hold torque is not dragged by the shank. Absent keeps all of it. */ dampingScale?: number;
  };
}
