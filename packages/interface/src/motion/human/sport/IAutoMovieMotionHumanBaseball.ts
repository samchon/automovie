import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Baseball and softball positions without the bat's swing or the pitch
 * (#3248): the catcher's crouch, fielding a ground ball, and the batting
 * stance with its load. The glove hand is the left; no glove or bat is held.
 *
 * - Catcher's crouch: the hips sink to a half squat
 *   (`exercise.drop`, provisional for a catcher) with the trunk pitched 20
 *   degrees, the glove presented palm forward 0.6 of the arm ahead of the
 *   crouched chest, the throwing fist behind the right knee.
 * - Ground ball: a squat to parallel thighs with the trunk inclined, the
 *   spine taking what the folded hips leave the pelvis
 *   (`AutoMovieMotionHumanTrunk.sunk`), until the shoulders stand where the
 *   reaching arm takes the glove, which stands on its fingertips on the
 *   floor 0.3 of the arm ahead of them, open forward and up, the throwing
 *   hand above it to cover the ball (provisional places).
 * - Batting stance: the left foot steps out to two shoulder widths, the
 *   knees give 3 % of the stature, both fists stacked on the implied bat's
 *   handle `HANDS` of the arm ahead of the right shoulder; the load at the stroke draws the hands a
 *   tenth of the arm back (provisional; the load precedes the stride,
 *   Welch et al. 1995).
 *
 * Each is a phrase: into the position in 0.8 s, held, and back to standing
 * in 0.8 s (provisional).
 *
 * Not drafted: the swing, the bunt and the check swing (the implement
 * strike owner's, #3244, whose file does not exist yet), the pitch (a row
 * of the throw law), the windmill pitch, the catcher's throw and base
 * running slides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds held; 1 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation seconds: Seconds held; 1 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.baseball, params); sport/baseball.ts (baseball.plan, context); sport/baseball.ts (baseball.plan); executable/cases/baseballCases.ts (baseballCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanBaseball {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The position and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The position. */
    kind: IAutoMovieMotionHumanBaseball.Kind;

    /** Seconds held; 1 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }

  /**
   * Capture cases of the baseball positions (#3248) from quiet standing. The positions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the baseball positions (#3248) from quiet standing. The positions.
   * @evidence contracts/development/design.md#principled-representation Closed choices "catcherCrouch", "groundBall", "battingStance" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/baseballCases.ts (baseballCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in baseballCases.
   */
  export type Kind = "catcherCrouch" | "groundBall" | "battingStance";
}
