import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";

/**
 * Tap dance on the beat clock (#3991): the shuffle, the flap, the ball
 * change, the heel drop, the cramp roll and a single time step. Every
 * sounding strike is an event `strike{k}{Side}{Part}` on its beat
 * subdivision, naming the foot and the part (ball, heel or flat) that
 * meets the floor then, so a sound can be placed from it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steps and the strike events.
 * @evidence contracts/development/design.md#principled-representation A step name, a tempo or track lock, a repeat count and the leading foot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/tapDance.ts (tapDance.STEPS, tapDance.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; their strikes are tapDance.STEPS.
 */
export namespace IAutoMovieMotionHumanTapDance {
  /**
   * The steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The steps' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "shuffle", "flap", "ballChange", "heelDrop", "crampRoll", "timeStep".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/tapDance.ts (tapDance.STEPS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Step =
    | "shuffle"
    | "flap"
    | "ballChange"
    | "heelDrop"
    | "crampRoll"
    | "timeStep";

  /**
   * The part of a shoe that sounds, or how a foot is set down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The ball's tap, the heel's drop, or the whole sole.
   * @evidence contracts/development/design.md#principled-representation Closed choices "ball", "heel", "flat".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/tapDance.ts (tapDance.STEPS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Part = "ball" | "heel" | "flat";

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The step. */
    step: Step;

    /** Beats per minute; the dance law's `BPM` when absent.
     * Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    bpm?: number;

    /** How many times the step is danced, the leading foot alternating; 1 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    repeats?: number;

    /** The foot that leads the first repeat; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}
