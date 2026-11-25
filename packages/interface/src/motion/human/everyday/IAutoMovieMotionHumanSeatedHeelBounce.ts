import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * One or more rhythmic heel raises from a seated position with both feet
 * planted.
 */
export interface IAutoMovieMotionHumanSeatedHeelBounce {
  /** The moving leg; the opposite foot remains planted. */
  side: AutoMovieHumanSide;

  /** The positive integer number of raises and returns. */
  count: number;

  /** Positive finite beats per second. */
  cadence: number;

  /** Peak heel rocker, in positive degrees; limited by the fitted leg's range. */
  amplitude: number;
}
