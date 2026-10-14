import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One laid module occurrence: the identity geometry, finish, and take-off
 * share.
 *
 * Produced by `generateAutoMovieSurfacePattern`. The module rectangle is
 * clipped to its zone region; a candidate whose clipped area, or whose area
 * after exclusions, is at most `1e-12` m² is absent rather than recorded with
 * zero area. `variant` depends only on the pattern seed, the variant count and
 * `id`, so it does not change when other pieces are added or reordered.
 *
 * @evidence contracts/common.md#principled-implementation The module rectangle is clipped to its convex zone region by Sutherland-Hodgman and measured against exclusions by convex clipping, so `area`, `coverage` and `cut` describe the piece as laid; the variant is a seeded draw from the pattern seed, the variant count and the id alone.
 * @evidence contracts/common.md#clear-and-simple-design Carries identity, provenance, the generated geometry and every derived measurement in one record, so mesh, slot, finish and take-off cite the same occurrence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fully clipped module is absent rather than recorded at zero area, and a punched piece keeps its convex outline with the loss in `punchedArea` rather than a fabricated non-convex shape.
 * @evidence contracts/common.md#meaningful-documentation States the producer, when a candidate is absent, the variant's dependence, the id format, units, the coverage range with its rounding caveat, the cut cases, and why joints use `outline` and what `punchedArea` means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; producing a placement includes a zone clip and exclusion clips whose costs depend on outline vertex counts, plus id hashing. The run owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The run builds placements once, and the instancer, texturer and take-off all read that one list rather than re-laying the pattern.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds fresh points and a fresh outline array owned by the run result.
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

  /**
   * Surviving fraction of the module's own area, within `(0, 1]` up to
   * floating-point rounding of the clipped area.
   */
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
