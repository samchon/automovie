import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Trick-riding figures on a moving horse's trick saddle: from the seat, each
 * figure in turn is reached over its transfer and held: the hippodrome stand, a
 * side drag with the foot in a strap, a back drag over the croup and a pickup
 * from the ground; the act ends back in the seat.
 */
export interface IAutoMovieMotionHumanTrick {
  /** The carrier's subject id, wearing a trick saddle. */
  on: string;

  /** The saddle's seat contact the figures are laid in. */
  frame: string;

  /** The figures in order. */
  figures: IAutoMovieMotionHumanTrick.IFigure[];
}
export namespace IAutoMovieMotionHumanTrick {
  /**
   * A trick-riding figure:
   *
   * - `seat`: back in the seat;
   * - `hippodrome`: standing on the seat, the feet under the hippodrome strap;
   * - `sideDrag`: hanging head down along `side`, the foot on that side in its
   *   strap;
   * - `backDrag`: hanging head down over the croup, both feet in their straps;
   * - `pickup`: leaning down along `side` with that hand on `object`, the other
   *   hand on the horn and the other foot in its strap.
   */
  export type Kind = "seat" | "hippodrome" | "sideDrag" | "backDrag" | "pickup";

  /** One figure. */
  export interface IFigure {
    /** The figure. */
    kind: Kind;

    /**
     * The side a drag or a pickup is made on; the left, the near side, when
     * absent.
     */
    side?: AutoMovieHumanSide;

    /**
     * Seconds it takes to reach from the figure before. No natural value is
     * defined: choose it for the beat (provisional, missing).
     */
    transfer: number;

    /**
     * Seconds it is held. No natural value is defined: choose it for the beat
     * (provisional, missing).
     */
    hold: number;

    /** The prop a pickup takes from the ground. */
    object?: string;
  }
}
