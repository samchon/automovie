import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanEnsemble } from "../next/IAutoMovieMotionHumanEnsemble";
import type { IAutoMovieMotionHumanObstacle } from "../perform/IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanResponse } from "../skill/IAutoMovieMotionHumanResponse";
import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";

/**
 * A crowd that keeps no formation, steered: each member (or each walking group,
 * as one agent) heads for its goals at its own drawn speed and avoids the
 * others and the obstacles, by one plan-time pass of the engine's
 * `steerAutoMovieCrowd`. The pass gives each member a course; the member's own
 * walk or run then keeps station on it (`walkStation`), so its feet are still
 * whole steps.
 *
 * A member's agent is a disc of its shoulders' half breadth (the shoulder
 * joint's half width plus the upper arm's radius) at its desired speed: its
 * gait's speed at its leg length by dynamic similarity (the walk's normal
 * Froude number, or the run's), scaled by a normal draw with the coefficient of
 * variation of pedestrians' desired speeds, 0.26 over 1.34 m/s (Helbing and
 * Molnar 1995), by fatigue, and in flight by morale
 * (`HUMAN_ATTRIBUTE_EFFECTS`). Its start is the cue plus its latency
 * (`HumanResponse`), and in flight its herding share is morale's. Every draw is
 * keyed by the member; adding a member changes the others' courses (they avoid
 * it) but never their draws.
 */
export namespace IAutoMovieMotionHumanCrowd {
  /**
   * A member's desired speed and delay as the pass draws them: its gait's speed
   * at its leg length scaled by its keyed normal draw (floored at `SLOWEST`,
   * its spread widened in flight by low morale's fluctuation,
   * `HUMAN_ATTRIBUTE_EFFECTS.morale.fluctuation`), by fatigue and in flight by
   * morale, and its response latency when the request names one. What a crowd
   * is steered by.
   */
  export interface IRequest {
    /** Each member's goals: a point, or points in order. */
    goals: (
      member: IAutoMovieMotionHumanEnsemble.IMember,
    ) => IAutoMovieVector3 | readonly IAutoMovieVector3[];

    /**
     * Its gait: `walk` at the walk's normal pace, about 1.5 m/s at the
     * reference hip, or `run` at the run pace, about 3.4 m/s (`walk.FROUDE`,
     * `run.GAITS`; the speed model is {@link IAutoMovieMotionHumanGait}). Each
     * member's speed is that scaled by its own leg length, a normal draw of 19
     * % (`HumanCrowd.SPREAD`), fatigue and, in flight, morale. `walk` fits a
     * plaza or a queue, `run` a stampede or an evacuation.
     */
    gait: "walk" | "run";

    /** The film second of the cue they set off on. */
    start: number;

    /** The film second the pass ends. */
    until: number;

    /** Each member's delay after the cue; none when absent. */
    latency?: IAutoMovieMotionHumanResponse.Latency;

    /**
     * Whether they flee: morale then raises the desired speed and the herding
     * share. Steady morale (1) leaves the speed; broken morale (0) multiplies
     * it by 1.5 and the herding share to 0.4, and widens the draw's spread to
     * twice (`HUMAN_ATTRIBUTE_EFFECTS`: Helbing, Farkas and Vicsek 2000; the
     * herding and fluctuation values provisional). A panic is `run` with
     * `flight` on a crowd of low morale. Not when absent.
     */
    flight?: boolean;

    /** What they steer round. */
    obstacles?: readonly IAutoMovieMotionHumanObstacle[];

    /**
     * Groups that walk together, each steered as one agent of its members'
     * combined breadth; none when absent.
     */
    groups?: readonly IAutoMovieMotionHumanEnsemble.IGroup[];
  }

  /** Steer the crowd. A steered crowd. */
  export interface IResult {
    /**
     * Each member's course frame, by member index; a grouped member's is its
     * group's.
     */
    frames: readonly IAutoMovieMotionHumanFormation.ICourse[];

    /** Each member's arrival second, or null when it does not arrive by `until`. */
    arrivals: readonly (number | null)[];
  }

  /**
   * A member's drawn desire: its desired speed, metres per second, and its
   * delay after the cue, seconds.
   */
  export interface IDesired {
    /**
     * The desired speed, metres per second: the request's gait speed at the
     * member's leg length, the draw, fatigue and, in flight, morale
     * (`IRequest.gait`, `IRequest.flight`). Fatigue 1 lowers it to the `weary`
     * preset's 0.8.
     */
    speed: number;

    /** The delay after the cue, seconds. */
    delay: number;
  }
}
