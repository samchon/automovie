import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One drafted straight segment and the design record that owns it.
 *
 * Both endpoints are page points rounded to six decimals, `from` is the one
 * that sorts first by `x` and then `y`, and a zero-length stroke is never
 * emitted. A drawing holds each stroke once: two edges of one owner that
 * project onto the same segment in the same role become one line. Lines are
 * sorted by role in {@link AutoMovieDrawingRole} order, then by layer, owner
 * and points.
 *
 * A boundary that carries a face and is realized by no element draws itself,
 * so {@link owner} and {@link layer} can name a boundary instead of an element.
 *
 * @evidence contracts/common.md#principled-implementation `draftAutoMovieDrawingLines` projects each world edge through the view frame, rounds both ends with `roundAutoMovieDrawingPoint`, drops strokes whose rounded ends coincide, orients each stroke from its smaller point, and deduplicates on role, layer, owner and the four coordinates, so equal strokes compare equal only after rounding onto one grid.
 * @evidence contracts/common.md#clear-and-simple-design A line carries only its owner, space, layer, role and two points; the pen weight and dash come from the view's style by role at serialization, so a line never stores a styling decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A face-only boundary takes the first space it separates rather than whichever space the view filter matched, which is a stated rule of the record and not a per-sheet adjustment; no owner kind receives special handling.
 * @evidence contracts/common.md#meaningful-documentation States the rounding, endpoint orientation, zero-length and duplicate rules, the sort order, and when the owner is a boundary; each member says what it names and when `space` is `null`.
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
