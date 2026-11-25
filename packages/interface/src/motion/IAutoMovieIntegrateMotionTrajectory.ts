import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTrajectoryInterval } from "./IAutoMovieMotionTrajectoryInterval";
import type { IAutoMovieMotionTrajectoryPartition } from "./IAutoMovieMotionTrajectoryPartition";

/**
 * Data and callback contracts shared by the IntegrateMotionTrajectory
 * operations.
 */
export namespace IAutoMovieIntegrateMotionTrajectory {
  /** What a trajectory is integrated from. */
  export interface IProps {
    /**
     * The right-hand side: the state's rate at a time, and with an orientation
     * the body-frame angular velocity, radians per second. Pure.
     */
    f: (
      t: number,
      x: readonly number[],
      q: IAutoMovieQuaternion | null,
    ) => IAutoMovieIntegrateMotionTrajectory.IRate;

    /** The vector state at `t0`. */
    x0: readonly number[];

    /**
     * The orientation at `t0`, a unit quaternion; absent for a state without
     * one.
     */
    q0?: IAutoMovieQuaternion;

    /** The first second. */
    t0: number;

    /** The last second, after `t0`. */
    t1: number;

    /**
     * The step, seconds, positive; `STEP` when absent. Under a `tolerance`, the
     * first step tried.
     */
    h?: number;

    /**
     * Error control: when given, the trajectory is integrated by the
     * Dormand-Prince 5(4) pair with steps chosen so each step's error estimate
     * stays within it, and read between knots by the pair's continuous
     * extension; when absent, the fixed-step classical method.
     */
    tolerance?: IAutoMovieIntegrateMotionTrajectory.ITolerance;

    /**
     * Optional continuous rotation-defect admission. Receives film seconds, the
     * dense orientation and its actual body angular velocity in rad/s. The pure
     * callback returns a nonnegative error normalized in its own physical
     * units: at most one admits, Infinity rejects. Adaptive dense control
     * checks paired extensions independently of the existing RMS. Requires both
     * q0 and an adaptive tolerance; otherwise admission throws. Smoothness
     * underlies the sampled estimator; arbitrary unsampled history features and
     * a downstream finite-difference observer are not certified. Borrowed
     * numeric records must not be mutated or retained for mutation.
     */
    rotationDefect?: (
      seconds: number,
      q: IAutoMovieQuaternion,
      w: IAutoMovieVector3,
    ) => number;

    /**
     * Optional caller-owned unique symbol correlating this operation's
     * failures. Admitted before the first RHS and copied only to this
     * integration's MotionTrajectoryFailure; it affects no numerical decision
     * and is not passed to f or rotationDefect.
     */
    errorScope?: symbol;

    /**
     * Optional operation-owned adaptive time mesh. Every trial still computes
     * and admits its own states, RMS and dense physical defect; only exact
     * interval boundaries are shared. The caller releases the mesh after its
     * whole operation. Ignored in fixed-step mode.
     */
    partition?: IAutoMovieMotionTrajectoryPartition.IPartition;
  }

  /**
   * A step's accepted error, per component: `absolute + relative × |value|`,
   * the vector state's value the larger of the step's two ends, the
   * orientation's the length of its rotation vector over the step, the error
   * norm the root mean square of the components' error over that.
   */
  export interface ITolerance {
    /** The share of a component's value, non-negative. */
    relative: number;

    /** The component's own unit, non-negative; not both zero. */
    absolute: number;

    /**
     * Optional partition into same-unit Euclidean vector blocks. Positive
     * integer lengths must sum to x0.length; [] is valid only for an empty
     * vector. Each block controls ||error||/(sqrt(length)_absolute +
     * relative_max(||start||,||end||)); the maximum of these errors and the
     * orientation's existing RMS controls acceptance. Without blocks the
     * existing componentwise RMS is unchanged. Equal numeric absolute
     * tolerances act in each block's own units, not equal physical units across
     * blocks.
     */
    blocks?: readonly number[];
  }

  /** A state's rate. */
  export interface IRate {
    /** The vector state's derivative, one per component. */
    dx: readonly number[];

    /**
     * The body-frame angular velocity, radians per second; required when the
     * state has an orientation.
     */
    w?: IAutoMovieVector3;
  }

  /** A state read at one time. */
  export interface IState {
    /** The vector state. */
    x: number[];

    /** The orientation, or null. */
    q: IAutoMovieQuaternion | null;
  }

  /** An integrated trajectory. */
  export interface ITrajectory {
    /** The first second. */
    t0: number;

    /** The last second. */
    t1: number;

    /** The step; under a tolerance, the first step tried. */
    h: number;

    /** The number of knots, the steps plus one. */
    knots: number;

    /**
     * The knots' times, seconds, from `t0` to `t1`: a fixed grid, or the
     * accepted steps' ends under a tolerance.
     */
    times: readonly number[];

    /**
     * Read adjacent actual fixed-step Hermite data; absent for adaptive
     * continuous extensions.
     *
     * @param time Finite query second; outside the interval selects the nearest
     *   end interval.
     * @returns Fresh copies of actual states and derivatives with their
     *   adjacent knot times.
     */
    interval?: (time: number) => IAutoMovieMotionTrajectoryInterval;

    /**
     * The state at a time, held at the ends outside `[t0, t1]`. Each call owns
     * its mutable vector and quaternion, including repeated reads.
     */
    at: (time: number) => IAutoMovieIntegrateMotionTrajectory.IState;

    /**
     * Optional orientation-only projection of the same solved curve. Each read
     * returns a fresh quaternion or null, without evaluating or copying the
     * vector block.
     */
    orientation?: (time: number) => IAutoMovieQuaternion | null;
  }
}
