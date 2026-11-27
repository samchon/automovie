import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";
import type { IAutoMovieMotionHumanEffort } from "./IAutoMovieMotionHumanEffort";
import type { IAutoMovieMotionHumanProxemics } from "./IAutoMovieMotionHumanProxemics";

/**
 * Walking up to a person, a prop or a point and stopping at an interpersonal
 * distance, facing it.
 *
 * The goal is the stop, not the steps: the front of the performer's chest (the
 * sternum region) must end `gap` short of the target, horizontally, along the
 * line from where the performer stands to the target (`HumanProxemics`). The
 * law turns that goal into the floor point the feet's midpoint must reach,
 * `gap` plus the chest's lead over the feet back from the target, and lets the
 * walk law place whole steps to it, so the stop is exact without sliding (the
 * walk's footprints are inverse-kinematics goals) and the body faces the target
 * because it walked straight at it.
 *
 * The target is read once, at the start: a person's region (the `sternum` for
 * Hall's chest-to-chest gaps, `upperBack` to stop behind someone), a prop's
 * point or a free point. For `handing` the gap comes from both people's own
 * measures, so a short and a tall partner meet at a gap both can reach; a prop
 * or point target uses the performer's measure alone. A target already nearer
 * than the requested gap is refused with both distances, since an approach
 * never backs away.
 *
 * A `side` stops on a named side of a person target instead, in that person's
 * own frame (their sternum's outward normal is their front), at the same gap,
 * and the walk's final heading turns the body to face them on the last steps.
 * The person approached on a side is walked round like one named in `avoid`, so
 * a stop behind them is not reached through them. People named in `avoid` are
 * walked round: where the straight leg would pass one nearer than the walker's
 * lateral clearance (0.5 m, provisional; walkers keep an elliptical personal
 * space wider ahead than to the side while circumventing a person,
 * Gerin-Lajoie, Richards and McFadyen 2005, Motor Control 9:242) plus half the
 * walker's chest breadth, a waypoint abeam that person takes the walk round on
 * the side that deviates least. Walkers moving past each other are not avoided
 * here; reciprocal avoidance belongs to the engine. An Effort sets the walk's
 * step length, arm swing and elbow width (`HumanEffort`); bound flow's elbows
 * held in cannot be shown, since the walk only widens them.
 *
 * With `track`, a person who moves is followed: their placed root is read ahead
 * over `HORIZON` seconds for where and when they come to rest, the stop is
 * taken against the target carried and turned with their root to that place,
 * and the walk waits in its first posture so that it arrives `LAG` after they
 * stop, which keeps the follower behind a leader on the leader's own line.
 * Where their way bends by more than `BEND` the walk goes by the places they
 * passed, and with `track: "pace"` it matches their speed instead of waiting
 * (`walkStation`; Rio, Rhea and Warren 2014).
 *
 * Events are the walk's (each foot's toe-offs and heel strikes, `lastFootfall`,
 * `arrive`), and `depart` where the walk waited.
 */
export namespace IAutoMovieMotionHumanApproach {
  /**
   * Parameters of an approach: what to walk up to, the gap to stop at, the side
   * to stop on, the pace, the movement quality, the manner and the people to
   * walk round. Every field but the target is optional with the default its doc
   * names.
   */
  export interface IParams {
    /** What to approach. */
    target: IAutoMovieMotionTarget;

    /**
     * The gap from the performer's chest to the target, metres or a named band
     * ({@link IAutoMovieMotionHumanProxemics.Band} gives the metres of each
     * band); `personal` when absent.
     */
    at?: IAutoMovieMotionHumanProxemics.Band | number;

    /**
     * Where around a person target to stop, in that person's own frame:
     * `front`, `left`, `right` or `behind`; along the line from the start when
     * absent (and always for a prop or point).
     */
    from?: "front" | "left" | "right" | "behind";

    /**
     * The walk's pace (`IAutoMovieMotionHumanWalkParams.pace` gives the
     * speeds); `normal` when absent. An approach never runs: for a charge or a
     * chase use `run` or `sprint`.
     */
    pace?: IAutoMovieMotionHumanGait.WalkPace;

    /**
     * Movement quality: Flow shortens the step by `0.15 flow`, Weight and Flow
     * scale the arm swing, Flow draws the elbows in (`HumanEffort.modifiers`);
     * its `time` factor is not read.
     */
    effort?: IAutoMovieMotionHumanEffort.IEffort;

    /**
     * How the walk there is performed
     * (`IAutoMovieMotionHumanWalkParams.manner`); neutral when absent.
     */
    manner?: IAutoMovieMotionManner;

    /** People to walk round on the way, by subject id. */
    avoid?: string[];

    /**
     * Whether a person target is followed where they go: the stop is taken at
     * the place they come to rest, read from their placed actions, and the walk
     * begins late enough to arrive just after them. The person is then composed
     * before this performer, or the read is refused. With `pace` the walk
     * instead matches the person's speed on the way (`walkStation`), so the gap
     * holds while they walk, and closes to the stop once they have stopped.
     * Absent, the target is read once, where it is when the approach begins.
     */
    track?: boolean | "pace";
  }

  /** A target's world point and outward unit normal. */
  export interface IAim {
    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** The outward unit normal; a person's sternum's is their front. */
    normal: IAutoMovieVector3;
  }
}
