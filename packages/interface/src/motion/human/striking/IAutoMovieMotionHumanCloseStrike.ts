import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A close strike: the point of the elbow, the back of a spinning fist or the
 * forehead brought onto a target inside the punch's range.
 *
 * - An elbow lands its olecranon with the arm folded past 120 degrees. The upper
 *   arm carries the elbow on a circle about the shoulder, so a target beyond
 *   the upper arm's length from the shoulder, after the trunk's turn and a
 *   half-stance shift of the pelvis, is refused with that band named; a target
 *   at punching range is out of it. `horizontalElbow` sweeps across the line,
 *   `risingElbow` comes up under the target and `descendingElbow` comes down
 *   onto it.
 * - `spinningElbow` and `spinningBackfist` turn the pelvis and trunk through a
 *   whole turn on the ball of the lead foot, the rear foot travelling round it,
 *   and land the rear arm's elbow or the back of its fist as the turn comes
 *   past the opponent.
 * - `headbutt` drives the forehead onto the target by the trunk's lean and a
 *   short shift of the pelvis, the hands holding either side of the partner's
 *   neck when the target is a person, or kept at the guard.
 *
 * No located study gives the delivery times of these strikes: they keep the
 * punch's measured jab delivery (Stanley et al. 2018) and hand recovery, scaled
 * by skill, and a spin adds one more delivery for its turn; all are
 * provisional.
 */
export namespace IAutoMovieMotionHumanCloseStrike {
  /** The close strikes. */
  export type Technique =
    | "horizontalElbow"
    | "risingElbow"
    | "descendingElbow"
    | "spinningElbow"
    | "spinningBackfist"
    | "headbutt";

  /** The arm that strikes: the stance's lead or rear. */
  export type Arm = "lead" | "rear";

  /** Parameters. */
  export interface IParams {
    /**
     * The close strike. It keeps the elite cross's timing: 0.310 s from launch
     * to contact at elite skill (Cheraghi et al. 2014), 1.06 times at novice,
     * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}); no
     * study of an elbow's or a headbutt's delivery time was located. GLORY
     * rules ban elbows (`KickboxingRules`).
     */
    technique: IAutoMovieMotionHumanCloseStrike.Technique;

    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /** The striking arm; rear when absent. A headbutt strikes with neither. */
    arm?: IAutoMovieMotionHumanCloseStrike.Arm;

    /** A feint: the share of the delivery shown before returning, in (0, 1). */
    feint?: number;
  }
}
