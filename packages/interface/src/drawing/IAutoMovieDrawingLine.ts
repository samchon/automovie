import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One drafted straight segment and the design element that owns it.
 *
 * Both endpoints are page coordinates rounded to six decimals, and a drawing
 * holds each distinct stroke once: two edges of one owner that project onto the
 * same segment in the same role are merged. A boundary that carries a face and
 * no realizing elements draws itself, so {@link owner} and {@link layer} can
 * name a boundary rather than an element.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawing` projects the silhouette and cut-plane edges of each drawable's world triangles through the view frame, rounds both endpoints to the six-decimal grid, drops a segment that collapses to a point, and orders the pair by x then y so one stroke has one spelling; the projection relies on the orthonormal frame `autoMovieDrawingFrame` builds or refuses.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of owner, space, layer, role and two page points lets the SVG serializer and other readers learn a stroke's provenance without matching geometry, while the stroke width stays in the view's style instead of being copied onto every segment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The one compensation is the merge keyed on role, layer, owner and rounded endpoints, needed because the near and far rings of a wall seen face-on project to the same segment; it reads no consumer, fixture or expected output.
 * @evidence contracts/common.md#meaningful-documentation States the rounding and endpoint order, the merge of identical strokes, that a face-only boundary can own a line, and why `space` carries the first separated space so a party wall reads alike on both rooms' sheets.
 * @author Samchon
 */
export interface IAutoMovieDrawingLine {
  /**
   * Element id this line was derived from, or the boundary id when a boundary
   * with a face and no realizing elements draws itself.
   */
  owner: string;

  /**
   * Logical space the owning element occupies, or `null`.
   *
   * A separation drawn from its own face carries the first of the spaces it
   * divides. That is a property of the design rather than of the sheet that
   * drew it, so one party wall reads the same on both of its rooms' sheets
   * instead of renaming itself per view.
   */
  space: string | null;

  /** Owning element's or boundary's kind, which is the drafting layer. */
  layer: string;

  /** Relation to the cut plane and the view depth. */
  role: AutoMovieDrawingRole;

  /** Page start point; lexicographically at or before {@link to}. */
  from: IAutoMovieDrawingPoint;

  /** Page end point. */
  to: IAutoMovieDrawingPoint;
}
