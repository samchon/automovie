import type { IAutoMoviePose } from "@automovie/interface";

/**
 * One cycle of a performed member's poses for the population layer to play:
 * the poses at even phases of one period, as a motion law displayed them
 * (`HumanPopulation.cycle` in the motions package), so a background member
 * plays the march the foreground members march instead of a generic gait.
 *
 * @evidence contracts/development/design.md#principled-representation A cycle as its even-phase canonical poses, its period and its stride, the three things a take is baked from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `bakeFormationCycle` alone; the render gains no motion vocabulary, only a table of poses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The poses are given, never synthesised here.
 * @evidence contracts/development/common.md#meaningful-documentation States what the poses are, at which phases, and the units.
 */
export interface IAutoMovieFormationPoseTake {
  /** The take's name, as a gait's: the name a population cue selects. */
  gait: string;

  /** Seconds of one cycle, positive. */
  periodSeconds: number;

  /** Metres the body travels in one cycle; measured from the lowest parts' tracks when absent. */
  strideMeters?: number;

  /** The poses at phases `i / poses.length`, i from 0, of one cycle. */
  poses: readonly IAutoMoviePose[];
}
