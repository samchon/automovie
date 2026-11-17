import type { IAutoMovieHumanNail } from "../hand/IAutoMovieHumanNail";

/**
 * The recorded digit inputs and generated nail outputs for F1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The recorded digit inputs and generated nail outputs for F1.
 * @evidence contracts/development/design.md#principled-representation Rows bind family names and segment frames to proportions, and each result carries that row with the generated nail.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1Nails owns the adaptation to the installed F1 family and returns the pair for capture and construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The general nail law remains independent of the named rows.
 */
export namespace IAutoMovieHumanF1Nails {
  /**
   * The digit, distal segment and authored proportions used to build one reference-family nail.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The digit, distal segment and authored proportions used to build one reference-family nail.
   * @evidence contracts/development/design.md#principled-representation Names identify construction family and segment; the hand flag chooses the declared phalanx axis convention. Numeric proportions retain the nail contract's units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1Nails uses these rows to adapt the figure and AutoMovieHumanNail consumes the proportions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The enumeration is an adapter for F1's registered names and frame conventions. The reusable nail law is owned separately.
   */
  export interface IRow {
    /** The digit family's chain name. */
    digit: string;

    /** The distal segment in `AutoMovieHumanF1Frames`. */
    segment: string;

    /**
     * Whether the segment is a hand's: a hand's phalanx has Y proximal and X volar (Wu et al. 2005 4.3.5), so its distal direction is
     * `-Y` and its dorsal `-X`; a toe's has X distal and Y dorsal.
     */
    hand: boolean;

    /** The proportions. */
    proportions: IAutoMovieHumanNail.IProportions;
  }

  /**
   * The proportion row and resulting nail for one reference-family digit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The proportion row and resulting nail for one reference-family digit.
   * @evidence contracts/development/design.md#principled-representation The source row identifies the segment and input proportions. The nail records the solved figure-space plate and skin reliefs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1Nails returns the pair so the body and inspection readers associate each result with its owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result binds one row to the nail actually produced, with identity maintained by the builder.
   */
  export interface IMade {
    /** The row. */
    row: IRow;

    /** The nail. */
    nail: IAutoMovieHumanNail.INail;
  }
}
