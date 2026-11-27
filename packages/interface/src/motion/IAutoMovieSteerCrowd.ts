import type { IAutoMovieCrowdAgent } from "./IAutoMovieCrowdAgent";

/**
 * Plan-time floor steering inputs and retained trajectory readers.
 * AutoMovieEngineMotionCrowd.steer admits finite positive agent radii and desired speeds,
 * finite starts and nonempty goals; integrateMotionTrajectory admits the
 * interval and step for a nonempty crowd. Other geometry and law ranges remain
 * caller obligations.
 */
export namespace IAutoMovieSteerCrowd {
  /** What a pass is planned from. */
  export interface IProps {
    /**
     * Borrowed agents in reporting order; empty input returns empty courses and
     * contacts without running interval admission. Do not mutate agents during
     * planning.
     */
    agents: readonly IAutoMovieCrowdAgent[];

    /** What they steer round; none when absent. */
    obstacles?: readonly IAutoMovieCrowdAgent.IObstacle[];

    /** The first film second. */
    from: number;

    /** The last film second, after ifromi. */
    to: number;

    /**
     * The integrator's step, seconds; AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep() when
     * absent.
     */
    step?: number;

    /**
     * The law's relaxation time and horizon, seconds; iRELAXATIONi and
     * iHORIZONi when absent.
     */
    law?: IPropsLaw;
  }

  /** The law object of {@link IProps}. */
  export type IPropsLaw = {
    /**
     * Positive finite response time in seconds for desired-velocity
     * relaxation; defaults to 0.5 seconds when law is absent. Not
     * range-checked here.
     */
    relaxation: number;
    /**
     * Positive finite anticipation horizon in seconds for avoidance; defaults
     * to 3 seconds when law is absent. Not range-checked here.
     */
    horizon: number;
  };

  /** A planned pass. */
  export interface IResult {
    /** Each agent's course, in the order given. */
    courses: readonly IAutoMovieCrowdAgent.ICourse[];

    /**
     * Overlaps observed at two consecutive trajectory knots, in detection
     * order, carrying their first knot's time and depth. The array is not
     * globally sorted by onset.
     */
    contacts: readonly IAutoMovieCrowdAgent.IContact[];
  }
}
