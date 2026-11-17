import type { IAutoMovieHumanLegGuides } from "./IAutoMovieHumanLegGuides";

/** Type contracts exchanged by AutoMovieHumanLegRingRow; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegRingRow {
  /** One ring as a row.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One ring as a row.
   * @evidence contracts/development/design.md#principled-representation `shape`: The guides and fullness, in units of the girth over 2 pi. `girth`: The ring's taut girth, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegRingRow.of. Also types AutoMovieHumanLegSectionLaw.low, AutoMovieHumanLegSectionLaw.high.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `shape`, `girth`; callers supply the complete record.
   */
  export interface IRow {
    /** The guides and fullness, in units of the girth over 2 pi. */
    shape: IAutoMovieHumanLegGuides.IShape;

    /** The ring's taut girth, mm. */
    girth: number;
  }

  /** The ring argument of AutoMovieHumanLegRingRow.of. The row of a ring.
  @param ring The ring in the section chart about the centre line, `[x, z]` mm, closed, counter-clockwise or not.
  @returns The guides, the fullness and the girth.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The row of a ring.
 * @evidence contracts/development/design.md#principled-representation The row of a ring. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegRingRow.OfRing is the canonical exchange used by AutoMovieHumanLegRingRow.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegRingRow.of for the row of a ring.
 */
  export type OfRing = readonly [number, number][];
}
