import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Projected aperture margins, depth windows and segment-addressed spatial
 * grids. Runtime construction and admission remain with
 * AutoMovieHumanLoftAperture in Human.
 */
export namespace IAutoMovieHumanLoftApertureConstruction {
  /**
   * The margin seen along the aperture's `forward` axis.
   *
   * Points are projected onto the plane perpendicular to `forward`, spanned by
   * `lateral` and `up`, and keep their depth along `forward`. `lateral` is
   * `forward x` world up (world +X for an opening facing within 25 degrees of
   * vertical, such as a nostril, where that product vanishes), and `up =
   * lateral x forward`, which is world up for a horizontal `forward`.
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
   * the segments whose bounding box overlaps it, and each row of cells (a band)
   * listing the segments whose height range overlaps it. Segment `i` runs from
   * point `i - 1` (the last for `i = 0`) to point `i`.
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
   * Lowest and highest world heights of the aperture margin, in millimetres, in
   * that order.
   */
  export type RangeResult = [number, number];
}
