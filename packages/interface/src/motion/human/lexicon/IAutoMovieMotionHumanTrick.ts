import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Trick-riding figures on a moving horse's trick saddle (#3950): from the seat, each figure in turn is reached over its transfer and held: the hippodrome stand, a side drag with the foot in a strap, a back drag over the croup and a pickup from the ground; the act ends back in the seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The carrier's subject id. frame: The saddle's seat contact. figures: The figures in order.
 * @evidence contracts/development/design.md#principled-representation A closed figure vocabulary, sides, seconds and a prop id.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanTrick` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every hold is the trick saddle's own moving contact.
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
   * - `sideDrag`: hanging head down along `side`, the foot on that side in its strap;
   * - `backDrag`: hanging head down over the croup, both feet in their straps;
   * - `pickup`: leaning down along `side` with that hand on `object`, the other hand on the horn and the other foot in its strap.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each figure's body placement and which straps, sides and hands it uses.
   * @evidence contracts/development/design.md#principled-representation A closed union of the trick-saddle figures, each held on the saddle's own contacts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IFigure.kind` reads it and `HumanTrick` branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per figure; a figure's side and pickup object are members of `IFigure` the other figures leave unused.
   */
  export type Kind = "seat" | "hippodrome" | "sideDrag" | "backDrag" | "pickup";

  /**
   * One figure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: The figure. side: The side it is made on. transfer: Seconds it takes to reach. hold: Seconds it is held. object: The prop a pickup takes from the ground.
   * @evidence contracts/development/design.md#principled-representation A closed kind, a side, seconds and a prop id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanTrick`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFigure {
    /** The figure. */
    kind: Kind;

    /** The side a drag or a pickup is made on; the left, the near side, when absent. */
    side?: AutoMovieHumanSide;

    /** Seconds it takes to reach from the figure before. No natural value is defined: choose it for the beat (provisional, missing). */
    transfer: number;

    /** Seconds it is held. No natural value is defined: choose it for the beat (provisional, missing). */
    hold: number;

    /** The prop a pickup takes from the ground. */
    object?: string;
  }
}
