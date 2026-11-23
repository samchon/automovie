import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePrincipalTensorFrame } from "../physics/IAutoMoviePrincipalTensorFrame";
import type { IAutoMovieIntegrateMotionTrajectory } from "./IAutoMovieIntegrateMotionTrajectory";
import type { IAutoMovieMotionTrajectoryPartition } from "./IAutoMovieMotionTrajectoryPartition";

/**
 * Root-frame mass histories and world-frame flight integration. integrateMotionTrajectory validates the time interval, step and tolerances; callers supply finite momentum, unit orientations and nonsingular positive principal moments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shape inertia and relative momentum use the root frame while conserved momentum and returned orientation use the world frame. Time is seconds; the integrator admits interval, step and tolerances, and callers supply finite momentum, unit orientation and nonsingular positive principal moments.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieIntegrateAirborneRotation contracts used by packages/engine/src/motion/integrateAirborneRotation.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Shape inertia and relative momentum use the root frame while conserved momentum and returned orientation use the world frame. Time is seconds; the integrator admits interval, step and tolerances, and callers supply finite momentum, unit orientation and nonsingular positive principal moments. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieIntegrateAirborneRotation contract belongs to interface; packages/engine/src/motion/integrateAirborneRotation.ts and packages/engine/src/motion/solveAirborneTakeoff.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieIntegrateAirborneRotation {
  /**
   * What a flight is integrated from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates world angular momentum from root-frame shape history and names time, sensitivity and tolerance units.
   * @evidence contracts/development/design.md#principled-representation The trajectory integrator admits finite ordered times, positive steps and tolerances; callers supply unit q0 and finite nonsingular inertia histories.
   * @evidence contracts/development/design.md#minimal-and-owned-surface integrateAirborneRotation consumes this request synchronously and returns readers over the integrated trajectory.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Variation directions reuse world momentum vectors, while returned tangents explicitly use body-frame radians per direction unit.
   */
  export interface IProps {
    /** Pure shape history sampled synchronously at integration stages. It must accept every time in [t0, t1]; errors propagate. The completed flight does not retain this callback. */
    history: IAutoMovieIntegrateAirborneRotation.IHistory;

    /** Take-off time in seconds on the history's clock, normally film seconds; finite. */
    t0: number;

    /** Touchdown on the same clock, finite and strictly after t0. */
    t1: number;

    /** The root's world orientation at take-off, unit. */
    q0: IAutoMovieQuaternion;

    /** The whole-body angular momentum about the centre of mass, world frame, kg m²/s; constant through the flight. */
    momentum: IAutoMovieVector3;

    /** The integrator's step, seconds; its default when absent. Under a `tolerance`, the first step tried. */
    h?: number;

    /** Relative and absolute integration error budgets; fixed-step when absent. The physical orientation and the same-unit tangent matrix use independent norms. A nonzero absolute number acts in each block's own units, not a shared physical unit. */
    tolerance?: Pick< IAutoMovieIntegrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;

    /** Optional dense angular-momentum error control, requiring adaptive integration. Relative is a share of the requested world momentum and absolute is kg m²/s; they are separate from the orientation budget. A zero resulting scale admits only zero defect. Sampled dense control does not certify a separate finite-difference pose observation. */
    momentumTolerance?: Pick<IAutoMovieIntegrateMotionTrajectory.ITolerance, "relative" | "absolute">;

    /** Optional caller-owned unique token correlating this flight's trajectory failures with its caller. Omitted, this integration creates its own token. Histories receive no token; nested failures with another scope pass through unchanged. */
    errorScope?: symbol;

    /** Momentum directions whose forward sensitivities are integrated with the orientation. Each returned tangent is in the instantaneous body's frame, radians per unit change of the corresponding direction. Absent, none are integrated. */
    variations?: readonly IAutoMovieVector3[];

    /** Optional time partition shared by one owned-history shooting operation. Each momentum still receives its original error checks; playback retains no partition. */
    partition?: IAutoMovieMotionTrajectoryPartition.IPartition;
  }

  /**
   * The shape's mass distribution at a second, in the root's own frame: its
   * composite inertia's principal frame and the relative angular momentum of
   * its segments' motion with respect to the root. The history factory retains
   * the shape callback, sampled bones and instant records until this function
   * is released; exact repeated times return the same record. Treat returned
   * records and source skeleton/model data as immutable while it is in use.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains root-frame samples and exact-time cache ownership in the history factory.
   * @evidence contracts/development/design.md#principled-representation A pure time reader returns composite inertia and relative momentum on the same clock as flight integration; factory samples are shared cached records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface integrateAirborneRotation.history retains the shape reader and sampled records for the returned reader's lifetime; integration invokes it during planning.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback carries physical mass data without a rig implementation handle or asynchronous lifecycle.
   */
  export type IHistory = (
    seconds: number,
  ) => IAutoMovieIntegrateAirborneRotation.IInstant;

  /**
   * The shape's mass distribution at one instant, root frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines centre-of-mass inertia and segment-relative momentum in the root frame.
   * @evidence contracts/development/design.md#principled-representation Principal moments have kg m-squared units and relative angular momentum kg m-squared/second; callers provide positive nonsingular moments.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Airborne integration rate applies the inverse principal tensor to carried momentum minus this relative momentum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Inertia reuses the existing principal-frame contract rather than duplicating an eigenframe representation.
   */
  export interface IInstant {
    /** The composite inertia about the centre of mass, as its principal frame, kg m². */
    inertia: IAutoMoviePrincipalTensorFrame;

    /** The angular momentum of the segments' motion relative to the root, about the centre of mass, kg m²/s. */
    relative: IAutoMovieVector3;
  }

  /**
   * A flight's orientation, read by time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the retained orientation and sensitivity readers with held endpoints and knot telemetry.
   * @evidence contracts/development/design.md#principled-representation Flight times share the history clock; orientations are world quaternions and sensitivity vectors are instantaneous-body-frame rotation tangents.
   * @evidence contracts/development/design.md#minimal-and-owned-surface integrateAirborneRotation returns these readers over its completed trajectory; callers release the flight to release retained integration data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No direction requested yields an empty tangent list rather than an invented derivative vector.
   */
  export interface IFlight {
    /** Take-off, seconds. */
    t0: number;

    /** Touchdown, seconds. */
    t1: number;

    /** The numerical integrator's first step tried, seconds; the requested/default step metadata for a supported exact curve. */
    h: number;

    /** Numerical stored-knot count (accepted steps plus one adaptively), or two logical interval boundaries for an exact closed curve. Exact boundaries are not RK/DP stages or stored orientation samples. */
    knots: number;

    /**
     * The root's world orientation at a second on the integration clock, held
     * at the ends outside the flight. Reads the retained trajectory without
     * calling the shape history; the caller must not mutate returned state.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateAirborneRotation.IFlight.orientation: The root's world orientation at a second on the integration clock, held at the ends outside the flight. Reads the retained trajectory without calling the shape history; the caller must not mutate returned state.
     */
    orientation: (seconds: number) => IAutoMovieQuaternion;

    /**
     * Body-frame rotation tangents with respect to the requested momentum directions, in their input order; an empty array when none were requested.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieIntegrateAirborneRotation.IFlight.variations: Body-frame rotation tangents with respect to the requested momentum directions, in their input order; an empty array when none were requested.
     */
    variations: (seconds: number) => readonly IAutoMovieVector3[];
  }

  /**
   * A shape's history: at each second, the composite inertia of the posed
   * bones and the relative momentum from the bones `DELTA` either side,
   * second order in `DELTA`, each instant computed once and kept by its exact
   * second for the history's lifetime.
   *
   * Given the flight's span, the three-point stencil slides up to its
   * boundary and then stays inside it. At a requested instant `t` away
   * from the stencil's centre `s`, its central momentum is corrected by
   * `(t-s)/δ` times the difference of its right and left half-interval
   * momenta: the derivative of a quadratic interpolant, second order in
   * `δ` (Fornberg 1988, Mathematics of Computation 51:699-706). Its weights
   * and nodes are continuous when it becomes centred again, so an ODE
   * reading the history sees no artificial stencil-switch discontinuity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains the finite-difference stencil's supported interval and lack of clamping for the requested inertia sample.
   * @evidence contracts/development/design.md#principled-representation from and to are seconds on the shape clock with finite from < to supplied by the caller; history does not admit this interval separately.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The history factory uses the span to keep derivative samples inside the shape's supported flight interval.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interval restricts sampling and contains no motion callback or alternate time origin.
   */
  export type IHistorySpan = {
    /** First supported shape time, seconds on the history clock. The caller must provide a finite nonzero span; the history factory does not validate it. */
    from: number;
    /** Last supported shape time, strictly after from. The derivative stencil stays inside this span; the requested inertia sample itself is not clamped. */
    to: number;
  };
}
