import { IAutoMovieDrawingSchedulePlace } from "./IAutoMovieDrawingSchedulePlace";

/**
 * One scheduled type and every occurrence of it.
 *
 * Opening and connector occurrences that agree on kind, model, width, height
 * and basis share a row; a room is always a row of its own. Every field but
 * {@link place} is shared by all members of a row.
 *
 * @evidence contracts/common.md#principled-implementation Members are sorted by UTF-16 code unit and cut at `AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS` (8) with the remainder counted, and `mark` numbers rows per kind in canonical order. Unresolved: `place` is copied from the first occurrence in design order while the group key ignores place, so a multi-member opening or connector row reports one member's location and its digest moves when the design reorders those occurrences.
 * @evidence contracts/common.md#clear-and-simple-design Type facts, the bounded member sample and a nullable place sit in one row so the schedule stays one flat list; the grouping decision belongs to the deriver, which keys a room row by its own id.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grouping by `basis` as well as size keeps void-measured and leaf-measured types in separate rows, and an absent dimension is `null` with a schedule gap rather than a zero placeholder.
 * @evidence contracts/common.md#meaningful-documentation Documents how the mark is assigned, the member bound and omitted count, what each basis measured for openings, connectors and rooms, and that a grouped row's place is its first occurrence's.
 * @author Samchon
 */
export interface IAutoMovieDrawingScheduleRow {
  /**
   * Deterministic type mark, such as `door-01`.
   *
   * Assigned from the row's position in the canonical order rather than from an
   * authored label, so the same design marks the same type identically on every
   * run and two derivations of one revision can be compared mark by mark.
   */
  mark: string;

  /** Kind shared by every occurrence in this row. */
  kind: string;

  /**
   * Model backing the occurrence's filling element, or `null` when it has no
   * visible element. Always `null` for room and connector rows.
   */
  model: string | null;

  /**
   * Nominal width in metres, or `null` when the design proves none.
   *
   * `null` is a statement that nothing in the design answers the question, not
   * a zero-width door. What was measured is stated by {@link basis}.
   */
  width: number | null;

  /** Nominal height in metres, or `null` when the design proves none. */
  height: number | null;

  /** Occurrences of this type. */
  count: number;

  /**
   * Occurrence ids, ascending, bounded by
   * {@link AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS}.
   */
  members: string[];

  /** Occurrences the bound left out; `count` minus `members.length`. */
  omittedMembers: number;

  /**
   * What {@link width} and {@link height} were measured from.
   *
   * `profile` is the thing itself: an opening's own void on its host boundary,
   * a connector's own declared section (its narrowest and lowest where it
   * varies), or a room's declared volume box. `fill` is a stand-in — the
   * filling element's extent, which is a door leaf's size and not the hole's,
   * and is the best a design that authored no void can offer. `unmeasured` is
   * neither, and the dimensions are absent rather than zero.
   *
   * Grouping is by basis as well as by size, so a type measured from a void and
   * a type measured from a leaf never merge into one row that means both.
   */
  basis: "profile" | "fill" | "unmeasured";

  /**
   * Where the occurrence sits.
   *
   * A schedule row that says only what a thing is and how many there are is
   * half an index: the requirement asks for location too, and a reviewer
   * choosing what to look at next needs the answer before the geometry. A room
   * row carries its own place. An opening or connector row carries the place of
   * the first occurrence the design lists, because place is not part of the
   * grouping, so other members of the same row may stand elsewhere; read each
   * member's own location from the design. The derivation currently fills every
   * row, and `null` is reserved for a subject that derives no place.
   */
  place: IAutoMovieDrawingSchedulePlace | null;
}
