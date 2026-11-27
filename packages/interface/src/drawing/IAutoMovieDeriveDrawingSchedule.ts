import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { AutoMovieDrawingScheduleSubject } from "./AutoMovieDrawingScheduleSubject";

/** Data and callback contracts shared by the DeriveDrawingSchedule operations. */
export namespace IAutoMovieDeriveDrawingSchedule {
  /**
   * Schedule every declared space, opening or connector of one design.
   *
   * Throws an `Error` naming the first violation when the design fails
   * `validateBuiltEnvironment`. The schedule and the drawing are two readings
   * of one graph: rows come from the design's own records, so `total` is the
   * number of spaces, openings or connectors it declares, and the row counts
   * sum to it by construction.
   *
   * Openings and connectors are grouped into type rows by kind, model, nominal
   * size and basis; a room is its own row, because two alike rooms are still
   * two rooms to visit. Rows are ordered by kind, model, size, basis and first
   * member, and marked `<kind>-NN` in that order. A row names at most
   * {@link AutoMovieEngineDrawingScheduleMaxMembers} members and counts the rest.
   *
   * An opening's size comes from its authored void or its fill's world extent,
   * labelled fill because the leaf is not the hole; with neither source its
   * sizes remain null and unmeasured. A connector uses its narrowest and lowest
   * declared section. Room rows carry declared-volume and measured-content
   * boxes plus graph relations. A grouped opening/connector row keeps the first
   * sorted occurrence's place, so that location does not describe every member;
   * missing schedule content is stated in gaps.
   *
   * The digest is SHA-256 over the canonical JSON of every other field.
   *
   * This function takes no drawing view and applies no view space or
   * element-kind filter. A space row also includes semantic or unlocated
   * containers, so the whole-design total need not equal the visible members of
   * a filtered drawing. The member-name limit bounds each returned row's named
   * prefix, while occurrences and grouping still process the full selected
   * subject population.
   */
  export type IProps = {
    /** Design the schedule is derived from. */
    environment: IAutoMovieBuiltEnvironment;

    /** What to count. */
    subject: AutoMovieDrawingScheduleSubject;
  };
}
