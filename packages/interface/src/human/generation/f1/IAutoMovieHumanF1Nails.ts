import type { IAutoMovieHumanNail } from "../hand/IAutoMovieHumanNail";

/** The recorded digit inputs and generated nail outputs for F1. */
export namespace IAutoMovieHumanF1Nails {
  /**
   * The digit, distal segment and authored proportions used to build one
   * reference-family nail.
   */
  export interface IRow {
    /** The digit family's chain name. */
    digit: string;

    /** The distal segment in `AutoMovieHumanF1Frames`. */
    segment: string;

    /**
     * Whether the segment is a hand's: a hand's phalanx has Y proximal and X
     * volar (Wu et al. 2005 4.3.5), so its distal direction is `-Y` and its
     * dorsal `-X`; a toe's has X distal and Y dorsal.
     */
    hand: boolean;

    /** The proportions. */
    proportions: IAutoMovieHumanNail.IProportions;
  }

  /** The proportion row and resulting nail for one reference-family digit. */
  export interface IMade {
    /** The row. */
    row: IRow;

    /** The nail. */
    nail: IAutoMovieHumanNail.INail;
  }
}
