import type { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One logical space's cross-section on the cut plane, per authored cell.
 *
 * A region is the convex section of one half-space cell of a space, so a room
 * drawn on two sheets is drawn from one declaration. Its area is the area of
 * that section and nothing else; it is not the space's floor area, which comes
 * from the support surfaces and is reported by the quantity report.
 *
 * Regions exist only for projections that cut, and only for the cells of spaces
 * the view includes that are stated as half-space cells. A space stated as a
 * closed shell, a cell the plane misses, and a cell its half-spaces leave
 * unbounded contribute none; the drawing reports shells and unbounded cells as
 * gaps. Regions are sorted by space id, then cell id.
 */
export interface IAutoMovieDrawingRegion {
  /** Logical space this cross-section belongs to. */
  space: string;

  /** Cell within that space. */
  cell: string;

  /** Space kind, which is the region's drafting layer. */
  kind: string;

  /**
   * Page polygon from convex half-plane clipping, with at least three stored
   * entries rounded to six decimals. No distinct-vertex, positive-area or
   * winding check runs after rounding, which can collapse a thin section.
   */
  polygon: IAutoMovieDrawingPoint[];

  /** Area of {@link polygon} in square metres, rounded to six decimals. */
  area: number;

  /**
   * The one distinct non-null material collected from held-model parts of
   * elements realizing this space's boundaries, or null when the collection has
   * zero or multiple ids. Missing models and parts with null material
   * contribute nothing, so one id does not prove every boundary has that
   * finish.
   *
   * This is a surface-material identity, not a construction build-up: separate
   * material assemblies are not supplied and material-build-up is a declared
   * gap. The SVG serializer writes data-finish metadata and does not color the
   * region from it.
   */
  finish: string | null;
}
