import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanThrowObjectLaunch } from "./IAutoMovieMotionHumanThrowObjectLaunch";

/**
 * Throwing a held object to a target: overarm, underarm, or a gentle toss.
 *
 * The goal is a launch: the object, held at the hand's grip, leaves the hand at
 * the release point with the velocity whose drag-free ballistic path passes
 * through the target. The release angle is the style's
 * (`throwObjectForm.ANGLE`, provisional; underarm precision throws regulate
 * speed and angle by distance, Dupuy, Mottet and Ripoll 2000, J Sports Sci
 * 18:375), and the speed follows from the range equation `v^2 = g d^2 / (2
 * cos^2 a (d tan a - h))` for the horizontal distance `d` and the rise `h` to
 * the target; a target the angle cannot reach is refused. The chamber and the
 * finish are places around the standing shoulder in arm lengths
 * (`throwObjectForm.PLACES`, provisional); the release is read from the
 * shoulder of the trunk's release pose, at the arm's reach for the elbow's
 * flexion where a study gives it ({@link throwObjectRelease}). The hand is drawn
 * back to the chamber on minimum-jerk progress (the windup), then driven on a
 * cubic Hermite curve from rest at the chamber to the launch velocity, taking
 * twice the path's length over the launch speed (the time of constant
 * acceleration from rest), carries that velocity unchanged for
 * `throwObjectForm.CARRY` seconds on each side of the release point, so the
 * launch does not depend on the instant the hand opens within it, and goes on
 * to rest at the finish over the same time; it holds, then returns to where it
 * hung. The trunk turns toward the throwing side in the windup, back square to
 * the line by the release and through to the other side by the finish, so the
 * trunk leads the arm (the proximal-to-distal sequence, Putnam 1993, J Biomech
 * 26 Suppl 1:125), and inclines forward from the cocking to the style's
 * `throwObjectForm.TILT` at release (Fleisig et al. 1999), rising again in the
 * recovery. Events: `windup` at the start, `cocked` (the end of cocking,
 * Fleisig et al. 1995's maximum external rotation for an overarm throw),
 * `release`, `followThrough`, `recover`.
 *
 * The plan carries its launch (`of`), so a catcher can intercept the path. A
 * thrown `prop` rides the hand by a grip window to the release and is launched
 * there (`IAutoMovieMotionHumanActionPlan.launches`), so it flies the same
 * path; `angle` replaces the style's release angle for a row with its own. An
 * `implement` held in the hand lengthens the lever the launch leaves from, and
 * a `turns` attitude spins the prop at the lever's rate rounded to whole half
 * turns to the target (`throwObjectLever`). Not yet: the stride, the two-hand
 * chest pass and overhead throws, the thrown prop riding the implement before
 * the release (it leaves from the implement's point, set on its way, until a
 * prop can hold a prop), the release-timing scatter of the endpoint-error model
 * (Hore et al. 1995), and feints.
 */
export namespace IAutoMovieMotionHumanThrowObject {
  /** A throw's plan: an action plan with its launch. */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /** The launch. */
    launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch;
  }
}
