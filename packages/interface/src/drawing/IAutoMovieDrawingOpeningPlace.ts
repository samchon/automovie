/**
 * Where an opening is: the boundary hosting it and the regions that boundary
 * separates.
 *
 * An opening has no contents, no declared volume, no measured content bounds
 * and no fidelity, so it answered `null` while this record was a room's alone —
 * and the schedule filed a permanent gap saying its location had to be read
 * from the design instead. The design always held the answer: an opening names
 * its host `boundary`, and a boundary names the one region it encloses or the
 * two it separates.
 */
export interface IAutoMovieDrawingOpeningPlace {
  /** Discriminant naming the subject this place describes. */
  kind: "opening";

  /**
   * Building unit that owns the host boundary's regions, or `null` when they do
   * not agree on one — a boundary between two units belongs to neither alone,
   * and naming one of them would be a choice this derivation has no basis for.
   */
  building: string | null;

  /** Boundary hosting the opening. */
  boundary: string;

  /**
   * Regions the host boundary encloses or separates, ascending.
   *
   * One entry where the boundary encloses a single region, two where it stands
   * between a pair, and never none: validation refuses a boundary that cites no
   * region, with *"a boundary must enclose one space or separate two, but cited
   * 0"*, and this derivation runs after that check.
   */
  separates: string[];
}
