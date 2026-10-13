import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One logical space's cross-section on the cut plane, per authored cell.
 *
 * A region is the convex section of one half-space cell of a space, so a room
 * drawn on two sheets is drawn from one declaration. Its area is the area of
 * that section and nothing else; it is not the space's floor area, which comes
 * from the support surfaces and is reported by the quantity report.
 *
 * Regions exist only for projections that cut, and only for the cells of
 * spaces the view includes that are stated as half-space cells. A space stated
 * as a closed shell, a cell the plane misses, and a cell its half-spaces leave
 * unbounded contribute none; the drawing reports shells and unbounded cells as
 * gaps. Regions are sorted by space id, then cell id.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingCellSection` clips a large counter-clockwise page square by each cell half-space mapped onto the page as `a x + b y <= c`, reports `bounded: false` when the result still reaches the square, and the drafter rounds the surviving polygon and takes its unsigned shoelace area with `autoMovieDrawingPolygonArea`.
 * @evidence contracts/common.md#clear-and-simple-design One region per cell keeps the section exact without a polygon union, and the space, cell and kind fields let a consumer join or style regions without re-reading the design.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unbounded cell is reported as `unbounded-space-cell` instead of drawing the clipping square as a room, a shelled space is reported as `shelled-space-section` instead of being approximated, and a finish that the realizing elements disagree on is `null` instead of the first material found.
 * @evidence contracts/common.md#meaningful-documentation States what a region is and is not, when regions exist and which spaces produce none, and the sort order; members give the polygon's convexity, winding and minimum size, the area unit and rounding, and how `finish` is resolved and when it is `null`.
 * @author Samchon
 */
export interface IAutoMovieDrawingRegion {
  /** Logical space this cross-section belongs to. */
  space: string;

  /** Cell within that space. */
  cell: string;

  /** Space kind, which is the region's drafting layer. */
  kind: string;

  /**
   * Convex page polygon, counter-clockwise in page axes, with at least three
   * points rounded to six decimals.
   */
  polygon: IAutoMovieDrawingPoint[];

  /** Area of {@link polygon} in square metres, rounded to six decimals. */
  area: number;

  /**
   * The one surface material bound by the parts of every element realizing a
   * boundary of this space, or `null` when those parts bind no material or
   * more than one.
   *
   * Elements whose model the design does not carry contribute nothing. This
   * is a surface material, not a construction build-up: material assemblies
   * are separate records the drawing is not handed, which the drawing declares
   * as the `material-build-up` gap. The SVG serializer writes it as
   * `data-finish` and does not fill the region by it.
   */
  finish: string | null;
}
