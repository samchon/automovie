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
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit, range and default.
   * @evidence contracts/development/design.md#principled-representation The step, the tempo in beats per minute or a cue-track lock, a whole repeat count and the leading foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members tapDance.plan reads; `lock` reuses the dance law's own type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: every member applies to every step, and the tempo and count ranges remain for runtime admission.
   */
  export interface IParams {
    /** The step. */
    step: Step;

    /** Beats per minute, positive; the dance law's `BPM` when absent. */
    bpm?: number;

    /** How many times the step is danced, a whole number of at least 1, the leading foot alternating; 1 when absent. */
    repeats?: number;

    /** The foot that leads the first repeat; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}
