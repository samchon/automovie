import type { IAutoMovieMotionHumanEnsemble } from "./IAutoMovieMotionHumanEnsemble";
import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";
import type { IAutoMovieMotionHumanObstacle } from "../perform/IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanResponse } from "../skill/IAutoMovieMotionHumanResponse";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A crowd that keeps no formation, steered: each member (or each walking
 * group, as one agent) heads for its goals at its own drawn speed and avoids
 * the others and the obstacles, by one plan-time pass of the engine's
 * `steerAutoMovieCrowd`. The pass gives each member a course; the member's
 * own walk or run then keeps station on it (`walkStation`), so its feet are
 * still whole steps.
 *
 * A member's agent is a disc of its shoulders' half breadth (the shoulder
 * joint's half width plus the upper arm's radius) at its desired speed: its
 * gait's speed at its leg length by dynamic similarity (the walk's normal
 * Froude number, or the run's), scaled by a normal draw with the
 * coefficient of variation of pedestrians' desired speeds, 0.26 over 1.34
 * m/s (Helbing and Molnar 1995), by fatigue, and in flight by morale
 * (`HUMAN_ATTRIBUTE_EFFECTS`). Its start is the cue plus its latency
 * (`HumanResponse`), and in flight its herding share is morale's. Every
 * draw is keyed by the member; adding a member changes the others' courses
 * (they avoid it) but never their draws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation latency: Each member's delay after the cue; none when absent. flight: Whether they flee: morale then raises the desired speed and the herding share. Not when absent. groups: Groups that walk together, each steered as one agent of its members' combined breadth; none when absent.
 * @evidence contracts/development/design.md#principled-representation latency: Each member's delay after the cue; none when absent. flight: Whether they flee: morale then raises the desired speed and the herding share. Not when absent. groups: Groups that walk together, each steered as one agent of its members' combined breadth; none when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, request); ensemble/HumanCrowd.ts (HumanCrowd.steer, request); ensemble/HumanCrowd.ts (HumanCrowd.desired, return); ensemble/HumanCrowd.ts (HumanCrowd.steer, return); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents); ensemble/HumanManoeuvre.ts (steered).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanEnsemble.IMember, IAutoMovieVector3, IAutoMovieMotionHumanResponse.Latency, IAutoMovieMotionHumanObstacle.IObstacle, IAutoMovieMotionHumanEnsemble.IGroup, IAutoMovieMotionHumanFormation.ICourse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCrowd {
  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed at its leg length scaled by its keyed normal draw (floored at `SLOWEST`, its spread widened in flight by low morale's fluctuation, `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by morale, and its response latency when the request names one. What a crowd is steered by.
   *
   * @evidence contracts/development/common.md#meaningful-documentation latency: Each member's delay after the cue; none when absent. flight: Whether they flee: morale then raises the desired speed and the herding share. Not when absent. groups: Groups that walk together, each steered as one agent of its members' combined breadth; none when absent.
   * @evidence contracts/development/design.md#principled-representation latency: Each member's delay after the cue; none when absent. flight: Whether they flee: morale then raises the desired speed and the herding share. Not when absent. groups: Groups that walk together, each steered as one agent of its members' combined breadth; none when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, request); ensemble/HumanCrowd.ts (HumanCrowd.steer, request).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanEnsemble.IMember, IAutoMovieVector3, IAutoMovieMotionHumanResponse.Latency, IAutoMovieMotionHumanObstacle.IObstacle, IAutoMovieMotionHumanEnsemble.IGroup identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IRequest {
    /** Each member's goals: a point, or points in order. */
    goals: (
      member: IAutoMovieMotionHumanEnsemble.IMember,
    ) => IAutoMovieVector3 | readonly IAutoMovieVector3[];

    /** Its gait. */
    gait: "walk" | "run";

    /** The film second of the cue they set off on. */
    start: number;

    /** The film second the pass ends. */
    until: number;

    /** Each member's delay after the cue; none when absent. */
    latency?: IAutoMovieMotionHumanResponse.Latency;

    /** Whether they flee: morale then raises the desired speed and the herding share. Not when absent. */
    flight?: boolean;

    /** What they steer round. */
    obstacles?: readonly IAutoMovieMotionHumanObstacle.IObstacle[];

    /** Groups that walk together, each steered as one agent of its members' combined breadth; none when absent. */
    groups?: readonly IAutoMovieMotionHumanEnsemble.IGroup[];
  }

  /**
   * Steer the crowd. A steered crowd.
   *
   * @evidence contracts/development/common.md#meaningful-documentation frames: Each member's course frame, by member index; a grouped member's is its group's. arrivals: Each member's arrival second, or null when it does not arrive by `until`.
   * @evidence contracts/development/design.md#principled-representation frames: Each member's course frame, by member index; a grouped member's is its group's. arrivals: Each member's arrival second, or null when it does not arrive by `until`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.steer, return); ensemble/HumanManoeuvre.ts (steered).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFormation.ICourse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IResult {
    /** Each member's course frame, by member index; a grouped member's is its group's. */
    frames: readonly IAutoMovieMotionHumanFormation.ICourse[];

    /** Each member's arrival second, or null when it does not arrive by `until`. */
    arrivals: readonly (number | null)[];
  }

  /**
   * A member's drawn desire: its desired speed, metres per second, and its delay after the cue, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation speed: The desired speed, metres per second. delay: The delay after the cue, seconds.
   * @evidence contracts/development/design.md#principled-representation speed: The desired speed, metres per second. delay: The delay after the cue, seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, return); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCrowd.desired.
   */
  export interface IDesired {
    /** The desired speed, metres per second. */
    speed: number;

    /** The delay after the cue, seconds. */
    delay: number;
  }
}
