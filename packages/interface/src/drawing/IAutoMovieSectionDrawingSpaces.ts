import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import type { IAutoMovieDrawingFrame } from "./IAutoMovieDrawingFrame";
import type { IAutoMovieDrawingRegion } from "./IAutoMovieDrawingRegion";

/**
 * Cut-plane space selection and the regions/limitations produced from its convex cells.
 *
 * @evidence contracts/development/design.md#principled-representation IProps identifies a validated world cut and selected spaces; IResult carries page-metre polygons, square-metre areas and distinct space/cell limitation counts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface deriveAutoMovieDrawing uses these records to share its frame/index and turn section limitations into gaps without additional scene state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported shells and working-window failures remain reported, and finish ids describe observed materials rather than full boundary coverage.
 * @evidence contracts/development/common.md#meaningful-documentation Inputs define selection/admission and results define geometry rounding, finish evidence and exact count populations.
 */
export namespace IAutoMovieSectionDrawingSpaces {
  /**
   * Borrowed validated design and resolved page frame for sectioning selected logical spaces.
   *
   * deriveAutoMovieDrawing calls this only for cutting projections, after validateBuiltEnvironment and autoMovieDrawingFrame. The lower-level sectioner assumes that referenced boundary elements exist, that the design index matches the environment, and that the frame is usable; it does not revalidate or mutate the authored design.
   *
   * @evidence contracts/development/design.md#principled-representation World half-spaces are sectioned on the frame's plane into page metres. Null selection means all spaces while an empty set means none; finite plane/frame arithmetic remains a runtime premise supplied by validated derivation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sectioner shares the same environment index and frame as line drafting; it needs space filtering but not element-kind filtering or sheet rendering state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shell-only volumes are counted as unsupported rather than replaced by guessed cells, and the filter's null/empty distinction prevents accidentally drawing all excluded spaces.
   * @evidence contracts/development/common.md#meaningful-documentation Gives selection semantics, coordinate frame, validation owner and stable borrowed-input requirements.
   */
  export type IProps = {
    /** Environment admitted by validateBuiltEnvironment; space cells and boundary-material relations are read from this snapshot. */
    environment: IAutoMovieBuiltEnvironment;

    /** Unrounded orthonormal page basis, with origin and normal defining the world cut plane; page lengths are metres. */
    frame: IAutoMovieDrawingFrame;

    /** Lookup index of the same environment snapshot, used to resolve boundary elements and their environment-owned model parts. */
    design: IAutoMovieDrawingDesignIndex;

    /** Included space ids, or null for all. An empty set selects none; unknown ids match nothing and are not diagnosed here. */
    spaces: ReadonlySet<string> | null;
  };

  /**
   * Fresh mutable section regions and the facts deriveAutoMovieDrawing turns into section gaps.
   *
   * Each bounded cell section with at least three unrounded points becomes one region. Its page-metre polygon is rounded to six decimals before shoelace area is computed and rounded to six decimals in square metres. No post-rounding degeneracy check removes collapsed polygons or zero areas. Regions are sorted by space id then cell id.
   *
   * Finish is the sole distinct non-null material id found among parts of environment-owned models realizing the space's boundaries, or null when zero or multiple ids are found. Missing models and null materials contribute no vote, so a finish does not certify that every boundary has material coverage.
   *
   * @evidence contracts/development/design.md#principled-representation Regions carry page metres and square metres; shelled counts spaces while unbounded counts cell sections reaching the finite clipping window. The latter is not proof that the original volume is mathematically unbounded.
   * @evidence contracts/development/design.md#minimal-and-owned-surface deriveAutoMovieDrawing consumes the regions and all three limitation fields; canonical region/point records carry geometry while counts and ids explain omissions without retaining the design index.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported shells and window-limited cells are reported rather than approximated, faceted declarations remain visible even without a drawn section, and ambiguous observed finishes remain null.
   * @evidence contracts/development/common.md#meaningful-documentation Defines rounding order, ordering, finish evidence, exact counter populations, faceted selection and caller-owned output.
   */
  export type IResult = {
    /** Fresh mutable regions sorted by space then cell; empty when no selected supported cell has a bounded section of at least three points before rounding. */
    regions: IAutoMovieDrawingRegion[];

    /** Sorted selected space ids declaring faceted fidelity, including selected shells and spaces the plane misses; these ids do not assert that a region was emitted. */
    faceted: string[];

    /** Nonnegative integer count of selected spaces with shell present; their cells are skipped regardless of intersection with the plane. */
    shelled: number;

    /** Nonnegative integer count of selected non-shell cell sections failing the 10 km clipping-window containment test; their polygons are omitted. */
    unbounded: number;
  };
}
