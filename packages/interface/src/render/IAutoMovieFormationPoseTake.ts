import type { IAutoMoviePose } from "../pose/IAutoMoviePose";

/**
 * One cycle of a performed member's poses for the population layer to play: the
 * poses at even phases of one period, as a motion law displayed them
 * (`HumanPopulation.cycle` in the motions package), so a background member
 * plays the march the foreground members march instead of a generic gait.
 */
export interface IAutoMovieFormationPoseTake {
  /** The take's name, as a gait's: the name a population cue selects. */
  gait: string;

  /** Seconds of one cycle, positive. */
  periodSeconds: number;

  /**
   * Metres the body travels in one cycle; measured from the lowest parts'
   * tracks when absent.
   */
  strideMeters?: number;

  /**
   * Borrowed poses at phases i / poses.length, i from zero, of one cycle.
   * bakeFormationCycle requires every supplied take to have the same nonzero
   * count; it leaves the borrowed display model at its last sampled pose.
   */
  poses: readonly IAutoMoviePose[];
}
