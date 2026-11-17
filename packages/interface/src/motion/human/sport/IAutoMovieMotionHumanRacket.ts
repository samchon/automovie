import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Racket and golf positions without the stroke itself (#3249): the tennis
 * ready position, the split step, and the golf address with its waggle. No
 * racket or club is held; the hands stand on the implied handle.
 *
 * - Ready position: the feet step apart to two shoulder widths, the knees
 *   give 4 % of the stature and the trunk leans 15 degrees, the racket hand
 *   on the handle at waist height before the body and the other hand a hand
 *   ahead on the throat (provisional places).
 * - Split step: from the ready position's width, a small hop of 3 % of the
 *   stature (provisional) in 0.3 s, landing a quarter shoulder width wider
 *   on each side, the step that precedes every stroke (Elliott et al. 1986
 *   place it before the serve's backswing; here before any stroke).
 * - Golf address: the trunk hinges 35 degrees at the hips over slightly
 *   flexed knees (provisional), the two hands together on the grip hanging
 *   `HANG` of the arm below the shoulders, and the waggle moves them a
 *   twentieth of the arm forward and back twice.
 *
 * Each is a phrase: into the position in 0.6 s, the stroke (the hop or the
 * waggle), held, and back in 0.6 s.
 *
 * Not drafted: groundstrokes, volleys, serves, smashes, badminton and table
 * tennis strokes, the golf swing, chip and putt. They are implement strikes
 * of the ball-strike owner (#3244), whose implement file does not exist
 * yet; the lunge to the net is the exercise lunge's row.
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: The racket or lead hand; `right` when absent. seconds: Seconds held; 0.6 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation side: The racket or lead hand; `right` when absent. seconds: Seconds held; 0.6 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.racket, params); sport/racket.ts (racket.plan, context); sport/racket.ts (racket.plan); executable/cases/racketCases.ts (racketCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRacket {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The position, the hand and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The position. */
    kind: IAutoMovieMotionHumanRacket.Kind;

    /** The racket or lead hand; `right` when absent. */
    side?: "left" | "right";

    /** Seconds held; 0.6 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of the racket and golf positions (#3249) from quiet standing. The positions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the racket and golf positions (#3249) from quiet standing. The positions.
   * @evidence contracts/development/design.md#principled-representation Closed choices "readyPosition", "splitStep", "golfAddress" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/racketCases.ts (racketCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in racketCases.
   */
  export type Kind = "readyPosition" | "splitStep" | "golfAddress";
}
