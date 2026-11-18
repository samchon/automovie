import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTrajectoryInterval } from "./IAutoMovieMotionTrajectoryInterval";
import type { IAutoMovieMotionTrajectoryPartition } from "./IAutoMovieMotionTrajectoryPartition";

/**
 * Data and callback contracts shared by the IntegrateMotionTrajectory operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieIntegrateMotionTrajectory contracts used by packages/engine/src/motion/integrateMotionTrajectory.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateMotionTrajectory contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieIntegrateMotionTrajectory {
  /**
   * What a trajectory is integrated from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieIntegrateMotionTrajectory.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateMotionTrajectory.IProps contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IProps {
    /**
     * The right-hand side: the state's rate at a time, and with an orientation the body-frame angular velocity, radians per second. Pure.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateMotionTrajectory.IProps.f: The right-hand side: the state's rate at a time, and with an orientation the body-frame angular velocity, radians per second. Pure.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieIntegrateMotionTrajectory.IProps.f is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieIntegrateMotionTrajectory.IProps.f is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieIntegrateMotionTrajectory.IProps.f is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieIntegrateMotionTrajectory.IProps.f is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieIntegrateMotionTrajectory.IProps.f is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieIntegrateMotionTrajectory.IProps.f is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     */
    f: (
      t: number,
      x: readonly number[],
      q: IAutoMovieQuaternion | null,
    ) => IAutoMovieIntegrateMotionTrajectory.IRate;

    /** The vector state at `t0`. */
    x0: readonly number[];

    /** The orientation at `t0`, a unit quaternion; absent for a state without one. */
    q0?: IAutoMovieQuaternion;

    /** The first second. */
    t0: number;

    /** The last second, after `t0`. */
    t1: number;

    /** The step, seconds, positive; `STEP` when absent. Under a `tolerance`, the first step tried. */
    h?: number;

    /**
     * Error control: when given, the trajectory is integrated by the
     * Dormand-Prince 5(4) pair with steps chosen so each step's error
     * estimate stays within it, and read between knots by the pair's
     * continuous extension; when absent, the fixed-step classical method.
     */
    tolerance?: IAutoMovieIntegrateMotionTrajectory.ITolerance;

    /**
     * Optional continuous rotation-defect admission. Receives film seconds,
     * the dense orientation and its actual body angular velocity in rad/s.
     * The pure callback returns a nonnegative error normalized in its own
     * physical units: at most one admits, Infinity rejects. Adaptive dense
     * control checks paired extensions independently of the existing RMS.
     * Requires both q0 and an adaptive tolerance; otherwise admission throws.
     * Smoothness underlies the sampled estimator; arbitrary unsampled history
     * features and a downstream finite-difference observer are not certified.
     * Borrowed numeric records must not be mutated or retained for mutation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateMotionTrajectory.IProps.rotationDefect: Optional continuous rotation-defect admission.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; its producer supplies rotationDefect and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to its producer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; its producer keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; its producer owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; its producer owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; its producer owns what it retains and releases.
     */
    rotationDefect?: (
      seconds: number,
      q: IAutoMovieQuaternion,
      w: IAutoMovieVector3,
    ) => number;

    /** Optional caller-owned unique symbol correlating this operation's failures. Admitted before the first RHS and copied only to this integration's MotionTrajectoryFailure; it affects no numerical decision and is not passed to f or rotationDefect. */
    errorScope?: symbol;

    /** Optional operation-owned adaptive time mesh. Every trial still computes and admits its own states, RMS and dense physical defect; only exact interval boundaries are shared. The caller releases the mesh after its whole operation. Ignored in fixed-step mode. */
    partition?: IAutoMovieMotionTrajectoryPartition.IPartition;
  }

  /**
   * A step's accepted error, per component: `absolute + relative × |value|`,
   * the vector state's value the larger of the step's two ends, the
   * orientation's the length of its rotation vector over the step, the
   * error norm the root mean square of the components' error over that.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieIntegrateMotionTrajectory.ITolerance keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateMotionTrajectory.ITolerance contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface ITolerance {
    /** The share of a component's value, non-negative. */
    relative: number;

    /** The component's own unit, non-negative; not both zero. */
    absolute: number;

    /** Optional partition into same-unit Euclidean vector blocks. Positive integer lengths must sum to x0.length; [] is valid only for an empty vector. Each block controls ||error||/(sqrt(length)*absolute + relative*max(||start||,||end||)); the maximum of these errors and the orientation's existing RMS controls acceptance. Without blocks the existing componentwise RMS is unchanged. Equal numeric absolute tolerances act in each block's own units, not equal physical units across blocks. */
    blocks?: readonly number[];
  }

  /**
   * A state's rate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieIntegrateMotionTrajectory.IRate keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateMotionTrajectory.IRate contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IRate {
    /** The vector state's derivative, one per component. */
    dx: readonly number[];

    /** The body-frame angular velocity, radians per second; required when the state has an orientation. */
    w?: IAutoMovieVector3;
  }

  /**
   * A state read at one time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieIntegrateMotionTrajectory.IState keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateMotionTrajectory.IState contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IState {
    /** The vector state. */
    x: number[];

    /** The orientation, or null. */
    q: IAutoMovieQuaternion | null;
  }

  /**
   * An integrated trajectory.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieIntegrateMotionTrajectory.ITrajectory keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateMotionTrajectory.ITrajectory contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface ITrajectory {
    /** The first second. */
    t0: number;

    /** The last second. */
    t1: number;

    /** The step; under a tolerance, the first step tried. */
    h: number;

    /** The number of knots, the steps plus one. */
    knots: number;

    /** The knots' times, seconds, from `t0` to `t1`: a fixed grid, or the accepted steps' ends under a tolerance. */
    times: readonly number[];

    /**
     * Read adjacent actual fixed-step Hermite data; absent for adaptive continuous extensions.
     *
     * @param time Finite query second; outside the interval selects the nearest end interval.
     * @returns Fresh copies of actual states and derivatives with their adjacent knot times.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval: Read adjacent actual fixed-step Hermite data; absent for adaptive continuous extensions.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieIntegrateMotionTrajectory.ITrajectory.interval is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     */
    interval?: (time: number) => IAutoMovieMotionTrajectoryInterval;

    /**
     * The state at a time, held at the ends outside `[t0, t1]`. Each call
     * owns its mutable vector and quaternion, including repeated reads.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateMotionTrajectory.ITrajectory.at: The state at a time, held at the ends outside `[t0, t1]`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieIntegrateMotionTrajectory.ITrajectory.at is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieIntegrateMotionTrajectory.ITrajectory.at is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieIntegrateMotionTrajectory.ITrajectory.at is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieIntegrateMotionTrajectory.ITrajectory.at is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieIntegrateMotionTrajectory.ITrajectory.at is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieIntegrateMotionTrajectory.ITrajectory.at is used through packages/engine/src/motion/integrateMotionTrajectory.ts.
     */
    at: (time: number) => IAutoMovieIntegrateMotionTrajectory.IState;

    /**
     * Optional orientation-only projection of the same solved curve. Each read returns a fresh quaternion or null, without evaluating or copying the vector block.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateMotionTrajectory.ITrajectory.orientation: Optional orientation-only projection of the same solved curve.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; its producer supplies orientation and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to its producer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; its producer keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; its producer owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; its producer owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; its producer owns what it retains and releases.
     */
    orientation?: (time: number) => IAutoMovieQuaternion | null;
  }
}
