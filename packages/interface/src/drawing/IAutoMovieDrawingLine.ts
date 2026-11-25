import type { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";
import type { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One drafted straight segment and the design record that owns it.
 *
 * Both endpoints are page points rounded to six decimals, `from` is the one
 * that sorts first by `x` and then `y`, and a zero-length stroke is never
 * emitted. A drawing holds each stroke once: two edges of one owner that
 * project onto the same segment in the same role become one line. Lines are
 * sorted by role in {@link AutoMovieDrawingRole} order, then by layer, owner and
 * points.
 *
 * A boundary that carries a face and is realized by no element draws itself, so
 * {@link owner} and {@link layer} can name a boundary instead of an element.
 */
export interface IAutoMovieDrawingLine {
  /**
   * Element id this line was derived from, or the boundary id when a boundary
   * with a face and no realizing element draws itself.
   */
  owner: string;

  /**
   * Logical space the owner occupies, or `null` for an element bound to no
   * space.
   *
   * A boundary drawing its own face carries the first of the spaces it
   * separates, so one party wall reads the same on both rooms' sheets.
   */
  space: string | null;

  /** Owner's element or boundary kind, which is the drafting layer. */
  layer: string;

  /** Relation of the owner to the cut plane and the view depth. */
  role: AutoMovieDrawingRole;

  /** Page start point; at or before {@link to} by `x`, then `y`. */
  from: IAutoMovieDrawingPoint;

  /** Page end point. */
  to: IAutoMovieDrawingPoint;
}
