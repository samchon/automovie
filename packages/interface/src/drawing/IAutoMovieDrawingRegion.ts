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
