import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A limp body laid across a saddle and carried: face down over the seat, folded
 * at the hips, the head and arms hanging down one side and the legs down the
 * other, carried by the carrier's contact.
 */
export interface IAutoMovieMotionHumanDrape {
  /** The carrier's subject id. */
  on: string;

  /** The carrier contact the body lies across, as the saddle's `seat`. */
  frame: string;

  /**
   * The carrier's side the head and arms hang on; its left, the near side, when
   * absent.
   */
  head?: AutoMovieHumanSide;

  /** How long the body is carried, seconds. */
  duration: number;

  /** Seconds it takes to come to lie across from the entry; 0.6 when absent. */
  lay?: number;
}
