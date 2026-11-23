import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";

/** World occupancy query against measurable building passage volumes. */
export namespace IAutoMoviePropBlockedPassages {
  /**
   * Every opening and connector a world volume intrudes on, openings first,
   * each group in declaration order.
   *
   * An opening is measured through the element that fills it, at its rest pose:
   * the fill's model parts, placed under its rest world matrix, bound the hole.
   * An open cut (`fill: null`), a fill that draws no model or whose model lives
   * outside the record, and a fill whose parent chain is missing or cyclic are
   * reported by neither this query nor the validator, because a passage nothing
   * measures cannot be proven blocked and guessing where the hole is would be
   * worse than saying nothing. A model present in the record but without
   * measurable vertices instead receives builtPlacedPartBoxes' degenerate box
   * at the staged fill element's world origin; this query preserves that
   * fallback.
   *
   * A connector is swept from its own route: each segment's box widens by half
   * the usable width horizontally and rises by the clear height, which is the
   * volume a body traversing it needs. A varying section is read at the
   * segment's ends and at every section station inside it, and the segment
   * takes the widest width and tallest clearance among them, so the box stays
   * an outer bound of the tapering corridor. A connector that states no
   * section, or whose route has no length, sweeps nothing: an unstated width is
   * not a width of zero, and `validateBuiltEnvironment` refuses that record on
   * its own path.
   *
   * Intrusion is {@link propBoundsOverlap}, so a volume that only touches a
   * passage does not block it.
   */
  export type IProps = {
    /**
     * Borrowed built environment whose rest opening fills and connector routes
     * define passage volumes. The one-shot query does not retain it after
     * returning.
     */
    environment: IAutoMovieBuiltEnvironment;
    /**
     * Borrowed world-axis-aligned volume in metres, normally prop occupancy or
     * clearance. Finite ordered corners are a caller/placement-validation
     * premise; touching alone does not block.
     */
    bounds: IAutoMoviePropBox;
  };
}
