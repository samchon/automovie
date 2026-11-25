import type { IAutoMovieHumanLegGuides } from "./IAutoMovieHumanLegGuides";

/**
 * A ring's normalized guide shape and taut girth, with its canonical millimetre
 * input contour.
 *
 * The interface package owns these declarations; AutoMovieHumanLegRingRow in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegRingRow {
  /** One ring as a row. */
  export interface IRow {
    /** The guides and fullness, in units of the girth over 2 pi. */
    shape: IAutoMovieHumanLegGuides.IShape;

    /** The ring's taut girth, mm. */
    girth: number;
  }

  /**
   * The ring argument of AutoMovieHumanLegRingRow.of. The row of a ring.
   *
   * @param ring The ring in the section chart about the centre line, `[x, z]`
   *   mm, closed, counter-clockwise or not.
   * @returns The guides, the fullness and the girth.
   */
  export type OfRing = readonly [number, number][];
}
