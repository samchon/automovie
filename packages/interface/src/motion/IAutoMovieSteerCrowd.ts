import type { IAutoMovieCrowdAgent } from "./IAutoMovieCrowdAgent";

/** Plan-time floor steering inputs and retained trajectory readers. steerAutoMovieCrowd admits finite positive agent radii and desired speeds, finite starts and nonempty goals; integrateMotionTrajectory admits the interval and step for a nonempty crowd. Other geometry and law ranges remain caller obligations. */
export namespace IAutoMovieSteerCrowd {
  /**
 * What a pass is planned from.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the film interval, step, force-law seconds and empty-crowd exception to interval admission.
 * @evidence contracts/development/design.md#principled-representation Agents use world floor metres; steering validates radius, desired speed, start and goals while trajectory integration validates nonempty-pass time and step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface steerAutoMovieCrowd borrows agents and obstacles to plan one pass; input ordering remains reporting identity despite canonical integration order.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional obstacles and law parameters refine the same pass rather than embedding scene-specific routes or runtime actors.
 */
    export interface IProps {
      /** Borrowed agents in reporting order; empty input returns empty courses and contacts without running interval admission. Do not mutate agents during planning. */
      agents: readonly IAutoMovieCrowdAgent[];
  
      /** What they steer round; none when absent. */
      obstacles?: readonly IAutoMovieCrowdAgent.IObstacle[];
  
      /** The first film second. */
      from: number;
  
      /** The last film second, after `from`. */
      to: number;
  
      /** The integrator's step, seconds; `integrateMotionTrajectory.STEP` when absent. */
      step?: number;
  
      /** The law's relaxation time and horizon, seconds; `RELAXATION` and `HORIZON` when absent. */
      law?: {
        /** Positive finite response time in seconds for desired-velocity relaxation; defaults to 0.5 seconds when law is absent. Not range-checked here. */
        relaxation: number;
        /** Positive finite anticipation horizon in seconds for avoidance; defaults to 3 seconds when law is absent. Not range-checked here. */
        horizon: number;
      };
    }

  /**
 * A planned pass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes input-order courses and consecutive-knot overlap reports in detection order.
 * @evidence contracts/development/design.md#principled-representation Courses carry film-time readers; contacts carry original-array indices, first overlap time and depth in metres. Output arrays are not frozen.
 * @evidence contracts/development/design.md#minimal-and-owned-surface steerAutoMovieCrowd produces the retained trajectories and contact diagnostics for motion planners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contacts report observed persistent overlaps instead of converting a best-effort steering plan into an unconditional collision-free claim.
 */
    export interface IResult {
      /** Each agent's course, in the order given. */
      courses: readonly IAutoMovieCrowdAgent.ICourse[];
  
      /** Overlaps observed at two consecutive trajectory knots, in detection order, carrying their first knot's time and depth. The array is not globally sorted by onset. */
      contacts: readonly IAutoMovieCrowdAgent.IContact[];
    }
}
