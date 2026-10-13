import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One logical volume's cross-section on the cut plane.
 *
 * A region is a space, not a room outline traced by hand: it is the exact
 * convex cross-section of one authored cell, so a room drawn on two sheets is
 * drawn from one declaration. Its area is the area of that cross-section and
 * nothing else — in particular it is not the space's floor area, which comes
 * from the support surfaces and is reported by the quantity report.
 *
 * Regions exist only for projections that cut, and only for spaces stated as
 * half-space cells; a shell-stated space contributes none and the drawing
 * reports that as a gap.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingCellSection` turns each cell half-space into a page half-plane and clips a square of `AUTOMOVIE_DRAWING_CELL_BOUND` metres by all of them (Sutherland-Hodgman), which yields the convex cross-section in counter-clockwise order; an outline still touching the square is reported as an `unbounded-space-cell` gap, and the area is the shoelace area of the rounded polygon.
 * @evidence contracts/common.md#clear-and-simple-design One region per sectioned cell rather than one merged outline per space, because a space is a union of convex cells and keeping them separate avoids polygon union while `space` still groups them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shell-stated space yields a `shelled-space-section` gap instead of an invented outline, and `finishOf` answers `null` when a space's boundary elements disagree on material rather than picking the first one found.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the cross-section area from floor area, states the polygon's convexity, winding and minimum size, which projections and spaces produce regions, and when `finish` is `null`.
 * @author Samchon
 */
export interface IAutoMovieDrawingRegion {
  /** Logical space this cross-section belongs to. */
  space: string;

  /** Cell within that space. */
  cell: string;

  /** Space kind, which is the region's drafting layer. */
  kind: string;

  /** Convex page polygon in counter-clockwise order; at least three points. */
  polygon: IAutoMovieDrawingPoint[];

  /** Area of {@link polygon} in square metres, rounded to six decimals. */
  area: number;

  /**
   * Material id a finish view fills this region with, or `null` when the
   * elements realizing the space's boundaries bind no material or more than
   * one.
   *
   * Resolved from the part materials of the elements realizing the space's
   * boundaries. It is a surface material and not a construction build-up: a
   * material assembly is a separate record from the built environment, a
   * drawing is derived from the environment alone, and the drawing declares
   * that reach as a gap rather than inventing a layer order it cannot see.
   */
  finish: string | null;
}
