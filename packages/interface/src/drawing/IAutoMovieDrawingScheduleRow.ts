import { IAutoMovieDrawingSchedulePlace } from "./IAutoMovieDrawingSchedulePlace";

/** One scheduled type and every occurrence of it. */
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

  /** Model backing the occurrence, or `null` when it has no visible element. */
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
   * or a connector's own declared section. `fill` is a stand-in — the filling
   * element's extent, which is a door leaf's size and not the hole's, and is
   * the best a design that authored no void can offer. `unmeasured` is neither,
   * and the dimensions are absent rather than zero.
   *
   * Grouping is by basis as well as by size, so a type measured from a void and
   * a type measured from a leaf never merge into one row that means both.
   */
  basis: "profile" | "fill" | "unmeasured";

  /**
   * Where the occurrence sits, or `null` when the subject derives no place.
   *
   * A schedule row that says only what a thing is and how many there are is
   * half an index: the requirement asks for location too, and a reviewer
   * choosing what to look at next needs the answer before the geometry. A room
   * row carries one, because a room *is* a place; an opening or connector row
   * does not yet, and the schedule states that as a gap rather than leaving the
   * absence to be read as "nowhere".
   */
  place: IAutoMovieDrawingSchedulePlace | null;
}
