import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One laid module occurrence: the identity geometry, finish, and take-off
 * share.
 *
 * Produced by `generateAutoMovieSurfacePattern`. The module rectangle is
 * clipped to its zone region; a candidate whose clipped area, or whose area
 * after exclusions, is at most `1e-12` m² is absent rather than recorded with
 * zero area. `variant` depends only on the pattern seed and `id`, so it does
 * not change when other pieces are added or reordered.
 *
 * @evidence contracts/common.md#principled-implementation Area is the shoelace area of the Sutherland-Hodgman clip of the rotated module against the convex region, minus its clipped intersections with each exclusion; the variant is `seededValue(seed, FNV-1a(id), domain)` scaled to the variant count.
 * @evidence contracts/common.md#clear-and-simple-design One record carries identity, the generator's inputs, measured survival and the clipped outline, so the mesh, instance slot, finish and take-off cite the same occurrence id.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The outline stays the region clip even when an exclusion punched the piece; the lost area is stated in `punchedArea` and reported as a finding rather than drawn as an outline that covers the hole.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the absence rule, the id spelling, frames and units, how area, coverage, cut and variant are derived, and why a punched outline is not the true piece.
 * @evidenceExclude contracts/performance.md#cost-and-resources Each costs one convex clip against the zone region plus one per exclusion, rebuilt per run with no clip shared between identical rectangles; it owns copied centre and size objects and its outline.
 * @author Samchon
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

  /** Surviving area in square metres: the region clip minus excluded area. */
  area: number;

  /** Surviving fraction of the module's own area, within `(0, 1]`. */
  coverage: number;

  /**
   * What reduced the module: `boundary` when the region clip lost area,
   * `exclusion` when an exclusion did, `both`, or `none`.
   */
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
