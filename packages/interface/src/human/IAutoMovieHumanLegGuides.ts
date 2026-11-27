import type { IAutoMoviePolarSector } from "../construction/IAutoMoviePolarSector";

/**
 * Normalized leg section guides, quarter fullness and optional neighbour-ring
 * endpoint constraints.
 *
 * The interface package owns these declarations; AutoMovieHumanLegGuides in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegGuides {
  /** The guides and the sectors of a section at one station. */
  export interface IShape {
    /** The eight guides by increasing angle. */
    guides: IAutoMoviePolarSector.IGuide[];

    /** One fullness per guide: sector `j` follows guide `j`. */
    fullness: number[];
  }

  /** A neighbour's ring read as the shape's row at its own station. */
  export interface IEnd {
    /** Station of the ring, mm. */
    at: number;

    /** The ring's guides and fullness, in units of its girth over 2 pi. */
    shape: IShape;
  }

  /** The rings the shape ends on. */
  export interface IEnds {
    /** The foot's ankle ring. */
    bottom?: IEnd;

    /** The trunk's crotch ring. */
    top?: IEnd;
  }

  /**
   * Result of AutoMovieHumanLegGuides.shape. The section's guides and fullness
   * along the leg.
   *
   * @param bones The joints' heights, which place the landmark rows.
   * @param ends The neighbours' rings, each the first or last row of every
   *   guide and sector.
   * @returns The shape at a station, in units of the section's girth over 2 pi.
   */
  export type ShapeResult = (s: number) => IShape;
}
