import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A limp body laid across a saddle and carried (#3951): face down over the seat, folded at the hips, the head and arms hanging down one side and the legs down the other, carried by the carrier's contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The carrier's subject id. frame: The carrier contact the body lies across. head: The carrier's side the head hangs on. duration: How long it is carried. lay: Seconds it takes to come to lie across.
 * @evidence contracts/development/design.md#principled-representation Subject and contact ids, a side and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanDrape` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The seat is the carrier's own moving contact.
 */
export interface IAutoMovieMotionHumanDrape {
  /** The carrier's subject id. */
  on: string;

  /** The carrier contact the body lies across, as the saddle's `seat`. */
  frame: string;

  /** The carrier's side the head and arms hang on; its left, the near side, when absent. */
  head?: AutoMovieHumanSide;

  /** How long the body is carried, seconds. */
  duration: number;

  /** Seconds it takes to come to lie across from the entry; 0.6 when absent. */
  lay?: number;
}
