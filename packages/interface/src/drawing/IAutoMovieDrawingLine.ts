import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/** One drafted straight segment and the design element that owns it. */
export interface IAutoMovieDrawingLine {
  /** Building element this line was derived from. */
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

  /** Owning element's kind, which is the drafting layer. */
  layer: string;

  /** Relation to the cut plane and the view depth. */
  role: AutoMovieDrawingRole;

  /** Page start point; lexicographically at or before {@link to}. */
  from: IAutoMovieDrawingPoint;

  /** Page end point. */
  to: IAutoMovieDrawingPoint;
}
