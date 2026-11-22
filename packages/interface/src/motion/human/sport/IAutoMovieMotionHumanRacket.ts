import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Racket-sport strokes (#3725 and #3726) and the solo ready position, split
 * step and golf address (#3249). A named implement stays in the racket hand
 * through preparation, impact and recovery.
 *
 * - Ready position: the feet step in sequence to two shoulder widths, the pelvis
 *   lowers by 4 % of stature and the trunk leans 15 degrees, the racket hand
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
   */
  export interface IParams {
    /** The position or stroke. */
    kind: IAutoMovieMotionHumanRacket.Kind;

    /** The racket or lead hand; `right` when absent. */
    side?: "left" | "right";

    /** Seconds held for a solo position, at least 0; 0.6 when absent. */
    seconds?: number;

    /** The held racket subject during a ready position, split step or stroke. Omit to rehearse without a prop. */
    implement?: string;

    /** The desired centre of the striking face at the stroke, in world metres. Omit for a body-relative rehearsal. */
    contactAt?: IAutoMovieVector3;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Solo racket and golf positions and court strokes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the original solo positions and the named sport-specific stroke set.
   * @evidence contracts/development/design.md#principled-representation Position and Stroke are separate closed unions routed to their respective planners.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/racketCases.ts (racketCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in racketCases.
   */
  export type Kind = Position | Stroke;

  /**
   * The original solo ready, split-step and golf actions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The cases are the stance, the preparatory hop and the golf address.
   * @evidence contracts/development/design.md#principled-representation Three named parameter cases dispatch through racket.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains the original position choices.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One case per supported position.
   */
  export type Position = "readyPosition" | "splitStep" | "golfAddress";

  /**
   * Court strokes with sport-specific support, approach and recovery.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each stroke by its sport and action.
   * @evidence contracts/development/design.md#principled-representation The closed set defines the supported court stroke profiles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One value per implemented stroke.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Court stroke dimensions and paths remain in the owning law.
   */
  export type Stroke =
    | "tennisServe"
    | "tennisForehand"
    | "tennisBackhand"
    | "tennisVolley"
    | "badmintonLunge"
    | "badmintonClear"
    | "tableTennisTopspin"
    | "squashDrive"
    | "padelGlassReturn";
}
