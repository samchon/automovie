import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePrincipalTensorFrame } from "../physics/IAutoMoviePrincipalTensorFrame";
import type { IAutoMovieIntegrateMotionTrajectory } from "./IAutoMovieIntegrateMotionTrajectory";
import type { IAutoMovieMotionTrajectoryPartition } from "./IAutoMovieMotionTrajectoryPartition";

/**
 * Root-frame mass histories and world-frame flight integration.
 * integrateMotionTrajectory validates the time interval, step and tolerances;
 * callers supply finite momentum, unit orientations and nonsingular positive
 * principal moments.
 */
export namespace IAutoMovieIntegrateAirborneRotation {
  /** What a flight is integrated from. */
  export interface IProps {
    /**
     * Pure shape history sampled synchronously at integration stages. It must
     * accept every time in [t0, t1]; errors propagate. The completed flight
     * does not retain this callback.
     */
    history: IAutoMovieIntegrateAirborneRotation.IHistory;

    /**
     * Take-off time in seconds on the history's clock, normally film seconds;
     * finite.
     */
    t0: number;

    /** Touchdown on the same clock, finite and strictly after t0. */
    t1: number;

    /** The root's world orientation at take-off, unit. */
    q0: IAutoMovieQuaternion;

    /**
     * The whole-body angular momentum about the centre of mass, world frame, kg
     * m²/s; constant through the flight.
     */
    momentum: IAutoMovieVector3;

    /**
     * The integrator's step, seconds; its default when absent. Under a
     * `tolerance`, the first step tried.
     */
    h?: number;

    /**
     * Relative and absolute integration error budgets; fixed-step when absent.
     * The physical orientation and the same-unit tangent matrix use independent
     * norms. A nonzero absolute number acts in each block's own units, not a
     * shared physical unit.
     */
    tolerance?: Pick<
      IAutoMovieIntegrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;

    /**
     * Optional dense angular-momentum error control, requiring adaptive
     * integration. Relative is a share of the requested world momentum and
     * absolute is kg m²/s; they are separate from the orientation budget. A
     * zero resulting scale admits only zero defect. Sampled dense control does
     * not certify a separate finite-difference pose observation.
     */
    momentumTolerance?: Pick<
      IAutoMovieIntegrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;

    /**
     * Optional caller-owned unique token correlating this flight's trajectory
     * failures with its caller. Omitted, this integration creates its own
     * token. Histories receive no token; nested failures with another scope
     * pass through unchanged.
     */
    errorScope?: symbol;

    /**
     * Momentum directions whose forward sensitivities are integrated with the
     * orientation. Each returned tangent is in the instantaneous body's frame,
     * radians per unit change of the corresponding direction. Absent, none are
     * integrated.
     */
    variations?: readonly IAutoMovieVector3[];

    /**
     * Optional time partition shared by one owned-history shooting operation.
     * Each momentum still receives its original error checks; playback retains
     * no partition.
     */
    partition?: IAutoMovieMotionTrajectoryPartition.IPartition;
  }

  /**
   * The shape's mass distribution at a second, in the root's own frame: its
   * composite inertia's principal frame and the relative angular momentum of
   * its segments' motion with respect to the root. The history factory retains
   * the shape callback, sampled bones and instant records until this function
   * is released; exact repeated times return the same record. Treat returned
   * records and source skeleton/model data as immutable while it is in use.
   */
  export type IHistory = (
    seconds: number,
  ) => IAutoMovieIntegrateAirborneRotation.IInstant;

  /** The shape's mass distribution at one instant, root frame. */
  export interface IInstant {
    /**
     * The composite inertia about the centre of mass, as its principal frame,
     * kg m².
     */
    inertia: IAutoMoviePrincipalTensorFrame;

    /**
     * The angular momentum of the segments' motion relative to the root, about
     * the centre of mass, kg m²/s.
     */
    relative: IAutoMovieVector3;
  }

  /** A flight's orientation, read by time. */
  export interface IFlight {
    /** Take-off, seconds. */
    t0: number;

    /** Touchdown, seconds. */
    t1: number;

    /**
     * The numerical integrator's first step tried, seconds; the
     * requested/default step metadata for a supported exact curve.
     */
    h: number;

    /**
     * Numerical stored-knot count (accepted steps plus one adaptively), or two
     * logical interval boundaries for an exact closed curve. Exact boundaries
     * are not RK/DP stages or stored orientation samples.
     */
    knots: number;

    /**
     * The root's world orientation at a second on the integration clock, held
     * at the ends outside the flight. Reads the retained trajectory without
     * calling the shape history; the caller must not mutate returned state.
     */
    orientation: (seconds: number) => IAutoMovieQuaternion;

    /**
     * Body-frame rotation tangents with respect to the requested momentum
     * directions, in their input order; an empty array when none were
     * requested.
     */
    variations: (seconds: number) => readonly IAutoMovieVector3[];
  }

  /**
   * A shape's history: at each second, the composite inertia of the posed bones
   * and the relative momentum from the bones `DELTA` either side, second order
   * in `DELTA`, each instant computed once and kept by its exact second for the
   * history's lifetime.
   *
   * Given the flight's span, the three-point stencil slides up to its boundary
   * and then stays inside it. At a requested instant `t` away from the
   * stencil's centre `s`, its central momentum is corrected by `(t-s)/δ` times
   * the difference of its right and left half-interval momenta: the derivative
   * of a quadratic interpolant, second order in `δ` (Fornberg 1988, Mathematics
   * of Computation 51:699-706). Its weights and nodes are continuous when it
   * becomes centred again, so an ODE reading the history sees no artificial
   * stencil-switch discontinuity.
   */
  export type IHistorySpan = {
    /**
     * First supported shape time, seconds on the history clock. The caller must
     * provide a finite nonzero span; the history factory does not validate it.
     */
    from: number;
    /**
     * Last supported shape time, strictly after from. The derivative stencil
     * stays inside this span; the requested inertia sample itself is not
     * clamped.
     */
    to: number;
  };
}
