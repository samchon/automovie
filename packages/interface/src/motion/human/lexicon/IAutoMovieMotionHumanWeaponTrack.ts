import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Tracking: a presented firearm kept on a target that moves. The weapon is
 * presented at where the target is when the action starts, and with `track` the
 * sight line then follows the target for as long as the carriage is held.
 *
 * The presented pose is turned as one rigid piece about the eye, by the least
 * rotation that takes the first sight line onto the line from the eye to where
 * the target is at that second (`context.aim` at the film second): the muzzle
 * stays on the sight line and the hand keeps the turn about the bore it was
 * presented with, so the pose moves as steadily as the target does. The eye is
 * the presenting posture's and does not move.
 *
 * First pass: the arms alone follow, the trunk and the feet do not turn, so a
 * target that leaves the arc the arms present to is still followed and the
 * arm's fit then gives way silently; no lead is taken ahead of a moving target,
 * and the tracking has no lag or tremor by skill.
 */
export namespace IAutoMovieMotionHumanWeaponTrack {
  /** What tracking adds to presenting a weapon. */
  export interface IParams {
    /** What it is aimed at. */
    target?: IAutoMovieMotionTarget;

    /**
     * Whether the aim follows the target while the carriage is held; `false`
     * when absent.
     */
    track?: boolean;
  }
}
