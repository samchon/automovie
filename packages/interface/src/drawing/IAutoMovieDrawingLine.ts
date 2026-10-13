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
