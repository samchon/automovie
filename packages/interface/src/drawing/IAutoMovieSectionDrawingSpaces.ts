import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import type { IAutoMovieDrawingFrame } from "./IAutoMovieDrawingFrame";
import type { IAutoMovieDrawingRegion } from "./IAutoMovieDrawingRegion";

/**
 * Cut-plane space selection and the regions/limitations produced from its
 * convex cells.
 */
export namespace IAutoMovieSectionDrawingSpaces {
  /**
   * Borrowed validated design and resolved page frame for sectioning selected
   * logical spaces.
   *
   * DeriveAutoMovieDrawing calls this only for cutting projections, after
   * validateBuiltEnvironment and drawingFrame. The lower-level
   * sectioner assumes that referenced boundary elements exist, that the design
   * index matches the environment, and that the frame is usable; it does not
   * revalidate or mutate the authored design.
   */
  export type IProps = {
    /**
     * Environment admitted by validateBuiltEnvironment; space cells and
     * boundary-material relations are read from this snapshot.
     */
    environment: IAutoMovieBuiltEnvironment;

    /**
     * Unrounded orthonormal page basis, with origin and normal defining the
     * world cut plane; page lengths are metres.
     */
    frame: IAutoMovieDrawingFrame;

    /**
     * Lookup index of the same environment snapshot, used to resolve boundary
     * elements and their environment-owned model parts.
     */
    design: IAutoMovieDrawingDesignIndex;

    /**
     * Included space ids, or null for all. An empty set selects none; unknown
     * ids match nothing and are not diagnosed here.
     */
    spaces: ReadonlySet<string> | null;
  };

  /**
   * Fresh mutable section regions and the facts deriveDrawing turns
   * into section gaps.
   *
   * Each bounded cell section with at least three unrounded points becomes one
   * region. Its page-metre polygon is rounded to six decimals before shoelace
   * area is computed and rounded to six decimals in square metres. No
   * post-rounding degeneracy check removes collapsed polygons or zero areas.
   * Regions are sorted by space id then cell id.
   *
   * Finish is the sole distinct non-null material id found among parts of
   * environment-owned models realizing the space's boundaries, or null when
   * zero or multiple ids are found. Missing models and null materials
   * contribute no vote, so a finish does not certify that every boundary has
   * material coverage.
   */
  export type IResult = {
    /**
     * Fresh mutable regions sorted by space then cell; empty when no selected
     * supported cell has a bounded section of at least three points before
     * rounding.
     */
    regions: IAutoMovieDrawingRegion[];

    /**
     * Sorted selected space ids declaring faceted fidelity, including selected
     * shells and spaces the plane misses; these ids do not assert that a region
     * was emitted.
     */
    faceted: string[];

    /**
     * Nonnegative integer count of selected spaces with shell present; their
     * cells are skipped regardless of intersection with the plane.
     */
    shelled: number;

    /**
     * Nonnegative integer count of selected non-shell cell sections failing the
     * 10 km clipping-window containment test; their polygons are omitted.
     */
    unbounded: number;
  };
}
