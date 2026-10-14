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
 * @evidence contracts/common.md#principled-implementation Cell half-spaces map to page inequalities and clip an initial square of half-extent 10000 m; reaching its edge within 1e-9 means bounded false, so a large bounded section can be reported unbounded. Coefficients at or below 1e-9 use the parallel-plane branch without normal normalization. The drafter rounds surviving vertices and unsigned shoelace area to six decimals; binary64 clipping and grid collapse do not certify exact topology or area.
 * @evidence contracts/common.md#clear-and-simple-design One region per cell avoids a polygon union and retains space/cell/kind identity. Overlapping cells can yield overlapping regions; the finish is the one distinct non-null material collected from realizing boundary elements' held model parts, rather than agreement proved for every boundary or a construction assembly.
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
   * Page polygon from convex half-plane clipping, with at least three stored entries rounded to six decimals. No distinct-vertex, positive-area or winding check runs after rounding, which can collapse a thin section.
   */
  polygon: IAutoMovieDrawingPoint[];

  /** Area of {@link polygon} in square metres, rounded to six decimals. */
  area: number;

  /**
   * The one distinct non-null material collected from held-model parts of elements realizing this space's boundaries, or null when the collection has zero or multiple ids. Missing models and parts with null material contribute nothing, so one id does not prove every boundary has that finish.
   *
   * This is a surface-material identity, not a construction build-up: separate material assemblies are not supplied and material-build-up is a declared gap. The SVG serializer writes data-finish metadata and does not color the region from it.
   */
  finish: string | null;
}
