import type { IAutoMoviePolarSector } from "../../../construction/IAutoMoviePolarSector";

/** Type contracts exchanged by AutoMovieHumanLegGuides; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegGuides {
  /** The guides and the sectors of a section at one station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The guides and the sectors of a section at one station.
   * @evidence contracts/development/design.md#principled-representation `guides`: The eight guides by increasing angle. `fullness`: One fullness per guide: sector `j` follows guide `j`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegGuides.shape. Also types AutoMovieHumanLegTube.shape, AutoMovieHumanLegTube.own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `guides`, `fullness`; callers supply the complete record.
   */
  export interface IShape {
    /** The eight guides by increasing angle. */
    guides: IAutoMoviePolarSector.IGuide[];

    /** One fullness per guide: sector `j` follows guide `j`. */
    fullness: number[];
  }

  /** A neighbour's ring read as the shape's row at its own station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A neighbour's ring read as the shape's row at its own station.
   * @evidence contracts/development/design.md#principled-representation `at`: Station of the ring, mm. `shape`: The ring's guides and fullness, in units of its girth over 2 pi.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegGuides.row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `shape`; callers supply the complete record.
   */
  export interface IEnd {
    /** Station of the ring, mm. */
    at: number;

    /** The ring's guides and fullness, in units of its girth over 2 pi. */
    shape: IShape;
  }

  /** The rings the shape ends on.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The rings the shape ends on.
   * @evidence contracts/development/design.md#principled-representation `bottom`: The foot's ankle ring. `top`: The trunk's crotch ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegGuides.shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `bottom`: The foot's ankle ring. `top`: The trunk's crotch ring.
   */
  export interface IEnds {
    /** The foot's ankle ring. */
    bottom?: IEnd;

    /** The trunk's crotch ring. */
    top?: IEnd;
  }

  /** Result of AutoMovieHumanLegGuides.shape. The section's guides and fullness along the leg.
  @param bones The joints' heights, which place the landmark rows.
  @param ends The neighbours' rings, each the first or last row of every guide and sector.
  @returns The shape at a station, in units of the section's girth over 2 pi.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The section's guides and fullness along the leg.
 * @evidence contracts/development/design.md#principled-representation The section's guides and fullness along the leg. The callable takes s and returns IShape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegGuides.ShapeResult is the canonical exchange used by AutoMovieHumanLegGuides.shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegGuides.shape for the section's guides and fullness along the leg.
 */
  export type ShapeResult = (s: number) => IShape;
}
