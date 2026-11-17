import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Projected aperture margins, depth windows and segment-addressed spatial grids. Runtime construction and admission remain with AutoMovieHumanLoftAperture in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes projected aperture margins, depth windows and segment-addressed spatial grids; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Projected aperture margins, depth windows and segment-addressed spatial grids. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanLoftAperture; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing LoftApertureConstruction contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanLoftApertureConstruction {
  /**
   * The margin seen along the aperture's `forward` axis.
   *
   * Points are projected onto the plane perpendicular to `forward`, spanned
   * by `lateral` and `up`, and keep their depth along `forward`. `lateral`
   * is `forward x` world up (world +X for an opening facing within 25
   * degrees of vertical, such as a nostril, where that product vanishes), and
   * `up = lateral x forward`, which is world up for a horizontal `forward`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The margin seen along the aperture's `forward` axis.
   * @evidence contracts/development/design.md#principled-representation `forward`: Unit direction the opening faces. `lateral`: Unit lateral axis of the projection plane. `up`: Unit second axis of the projection plane, `lateral x forward`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLoftAperture.outline. Read by AutoMovieHumanBodyRoots.trim, AutoMovieHumanLoftAperture.signed, AutoMovieHumanLoftAperture.snap.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `forward`, `lateral`, `up`, `points`, `window`, `box`, `grid`; callers supply the complete record.
   */
  export interface IOutline {
    /** Unit direction the opening faces. */
    forward: AutoMovieVector3Tuple;

    /** Unit lateral axis of the projection plane. */
    lateral: AutoMovieVector3Tuple;

    /** Unit second axis of the projection plane, `lateral x forward`. */
    up: AutoMovieVector3Tuple;

    /** Projected margin polyline `[lateral, up]`, mm. */
    points: [number, number][];

    /** Depth window along `forward`: the margin's own, widened by `depth`. */
    window: [number, number];

    /** Bounding box of `points`: `[lateral, up]` minimum then maximum. */
    box: [number, number, number, number];

    /** The segments of `points` by cell and by row, for {@link signed}. */
    grid: IGrid;
  }

  /**
   * A square grid of cells over an outline's bounding box, each cell listing
   * the segments whose bounding box overlaps it, and each row of cells (a
   * band) listing the segments whose height range overlaps it. Segment `i`
   * runs from point `i - 1` (the last for `i = 0`) to point `i`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A square grid of cells over an outline's bounding box, each cell listing the segments whose bounding box overlaps it, and each row of cells (a band) listing the segments whose height range overlaps it.
   * @evidence contracts/development/design.md#principled-representation `origin`: Lower corner `[lateral, up]` of the first cell, mm. `size`: Side of a cell, mm. `columns`: Cells across.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLoftAperture.gridOf. Also types AutoMovieHumanLoftAperture.g.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `origin`, `size`, `columns`, `rows`, `cells`, `bands`; callers supply the complete record.
   */
  export interface IGrid {
    /** Lower corner `[lateral, up]` of the first cell, mm. */
    origin: [number, number];

    /** Side of a cell, mm. */
    size: number;

    /** Cells across. */
    columns: number;

    /** Cells up. */
    rows: number;

    /** Segments per cell, row by row. */
    cells: number[][];

    /** Segments per row of cells. */
    bands: number[][];
  }

  /**
   * Lowest and highest world heights of the aperture margin, in millimetres, in that order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lowest and highest world heights of the aperture margin, in millimetres, in that order.
   * @evidence contracts/development/design.md#principled-representation Lowest and highest world heights of the aperture margin, in millimetres, in that order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLoftApertureConstruction.RangeResult is the canonical exchange used by AutoMovieHumanLoftAperture.range.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanLoftAperture input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type RangeResult = [number, number];
}
