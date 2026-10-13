import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One laid module occurrence: the identity geometry, finish, and take-off
 * share.
 */
export interface IAutoMoviePatternPlacement {
  /** Occurrence identity, `"<zone>/<module>"`. */
  id: string;
  /** The zone that laid it. */
  zone: string;
  /** The generator's own module id inside that zone. */
  module: string;
  /** Surface material id inherited from the zone, or `null`. */
  material: string | null;
  /** Module centre in face-local metres, as generated. */
  center: IAutoMoviePatternPoint;
  /** Module footprint in metres, as generated. */
  size: {
    /** Extent along the module's own U axis. */
    u: number;
    /** Extent along the module's own V axis. */
    v: number;
  };
  /** In-plane module rotation in degrees. */
  rotationDeg: number;
  /** Grain direction in degrees, read modulo 180. */
  grainDeg: number;
  /** Whether the piece is laid face-flipped, its own U axis reversed. */
  mirror: boolean;
  /** Surviving area in square metres. */
  area: number;
  /** Surviving fraction of the module's own area, within `(0, 1]`. */
  coverage: number;
  /** What reduced the module, if anything. */
  cut: "none" | "boundary" | "exclusion" | "both";
  /** Seeded variant index within `[0, variants)`. */
  variant: number;
  /**
   * The module clipped to its zone region, counter-clockwise.
   *
   * This, and not the module rectangle, is what a joint is measured between,
   * because a joint is read on the surface rather than on the drawing.
   */
  outline: IAutoMoviePatternPoint[];
  /**
   * Square metres an exclusion took out of the area {@link outline} draws.
   *
   * The outline is a convex polygon, because a convex module clipped to a
   * convex region stays convex. Subtracting an exclusion generally does not, so
   * a punched piece's true shape is not this outline and no convex kernel path
   * can build it; the run reports that as its own finding rather than handing
   * back an outline that quietly covers the opening. Zero means no exclusion
   * reached the piece and the outline is the piece.
   */
  punchedArea: number;
}
