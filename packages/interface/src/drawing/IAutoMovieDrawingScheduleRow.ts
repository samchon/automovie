import { IAutoMovieDrawingSchedulePlace } from "./IAutoMovieDrawingSchedulePlace";

/**
 * One scheduled type and every occurrence of it.
 *
 * Opening and connector occurrences that agree on kind, model, width, height
 * and basis share a row; a space is always a row of its own. Every field but
 * {@link members} and {@link place} is shared by all members of a row.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` keys occurrences by a JSON array of kind, model, width, height and basis, sorts each group by its comparator ending in id, numbers rows per kind in row order for the mark, and keeps the first `AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS` ids of the ascending member list.
 * @evidence contracts/common.md#clear-and-simple-design Shared type columns, a bounded member sample with its remainder, the measurement basis and one place make a row self-sufficient for reading a schedule, while the full per-member data stays in the design.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmeasured sizes are `null` with basis `unmeasured` instead of zero, and grouping includes the basis so a void-measured type never merges with a leaf-measured one; `place` is always derived, with no reserved absent state.
 * @evidence contracts/common.md#meaningful-documentation States the grouping columns and which fields vary per member; members give the mark's derivation and stability, when `model` is `null`, the metre unit and per-subject meaning of the sizes, the member bound and remainder, what each basis measured, and whose place a type row carries.
 * @author Samchon
 */
export interface IAutoMovieDrawingScheduleRow {
  /**
   * Deterministic type mark, `<kind>-NN`, numbered from `01` per kind in row
   * order.
   *
   * The mark comes from the row's position in the canonical order rather than
   * from an authored label, so the same design marks the same type identically
   * on every run and two derivations of one revision compare mark by mark.
   */
  mark: string;

  /** Kind shared by every occurrence in this row. */
  kind: string;

  /**
   * Model id the opening's filling element cites, or `null` when the opening
   * has no fill or the fill cites no model. Always `null` for space and
   * connector rows.
   */
  model: string | null;

  /**
   * Nominal width in metres, rounded to six decimals, or `null` when
   * {@link basis} is `unmeasured`.
   *
   * An opening reports its void's or leaf's width, a connector its narrowest
   * stated section, and a space the wider of its declared box's world X and Z
   * extents. `null` states that nothing in the design answers, not a zero-width
   * door.
   */
  width: number | null;

  /**
   * Nominal height in metres, rounded to six decimals, or `null` when
   * {@link basis} is `unmeasured`: an opening's void or leaf height, a
   * connector's lowest stated clear height, or a space's declared world Y
   * extent.
   */
  height: number | null;

  /** Occurrences of this type. */
  count: number;

  /**
   * Occurrence ids, ascending, at most the engine's
   * `AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS`.
   */
  members: string[];

  /** Occurrences the bound left out; `count` minus `members.length`. */
  omittedMembers: number;

  /**
   * What {@link width} and {@link height} were measured from.
   *
   * `profile` is the thing itself: an opening's own void on its host boundary,
   * a connector's own declared section, or a space's declared volume box.
   * `fill` is an opening's filling element extent, which is the leaf's size and
   * not the hole's. `unmeasured` is neither, and the sizes are `null`. A
   * connector is never `unmeasured`, because validation requires it to state a
   * section.
   */
  basis: "profile" | "fill" | "unmeasured";

  /**
   * Where the occurrence sits, as the place variant of the schedule's subject.
   *
   * A space row carries its own place. An opening or connector row carries the
   * place of its first member in {@link members}, because place is not a
   * grouping column; other members may stand elsewhere, so read their
   * locations from the design.
   */
  place: IAutoMovieDrawingSchedulePlace;
}
