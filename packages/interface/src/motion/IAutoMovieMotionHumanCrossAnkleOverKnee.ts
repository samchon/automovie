import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * An ankle-over-knee rest after sitting on a chair with both feet down.
 *
 * The registered crossAnkleOverKnee law owns admission against the entry seat,
 * floor contacts and the performer's leg reach.
 */
export interface IAutoMovieMotionHumanCrossAnkleOverKnee {
  /** The ankle to lift over the other knee. Defaults to right. */
  side?: AutoMovieHumanSide;

  /**
   * Seconds resting across the other knee before returning. Defaults to 1.
   * Minimum 0.
   */
  hold?: number;
}
