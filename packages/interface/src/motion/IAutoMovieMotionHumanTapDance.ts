import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";

/**
 * Tap dance on the beat clock: the shuffle, the flap, the ball change, the heel
 * drop, the cramp roll and a single time step. Every sounding strike is an
 * event `strike{k}{Side}{Part}` on its beat subdivision, naming the foot and
 * the part (ball, heel or flat) that meets the floor then, so a sound can be
 * placed from it.
 */
export namespace IAutoMovieMotionHumanTapDance {
  /** The steps. */
  export type Step =
    | "shuffle"
    | "flap"
    | "ballChange"
    | "heelDrop"
    | "crampRoll"
    | "timeStep";

  /** The part of a shoe that sounds, or how a foot is set down. */
  export type Part = "ball" | "heel" | "flat";

  /** Parameters. */
  export interface IParams {
    /** The step. */
    step: Step;

    /** Beats per minute, positive; the dance law's `BPM` when absent. */
    bpm?: number;

    /**
     * How many times the step is danced, a whole number of at least 1, the
     * leading foot alternating; 1 when absent.
     */
    repeats?: number;

    /** The foot that leads the first repeat; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}
