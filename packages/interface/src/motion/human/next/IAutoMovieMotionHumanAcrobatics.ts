import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Authoring inputs and presets for acrobatics operations.
 */
export namespace IAutoMovieMotionHumanAcrobatics {
  /**
   * The values a round-off led with one hand fixes: the hand that goes down
   * first. It is spread into `roundOff`'s parameters, which keep the duration
   * open.
   */
  export interface IRoundOffPreset {
    /** The hand that goes down first, the person's own left or right. */
    lead: AutoMovieHumanSide;
  }
}
