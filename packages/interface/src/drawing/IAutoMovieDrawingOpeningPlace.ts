/**
 * Where an opening is: the boundary hosting it and the spaces that boundary
 * separates.
 *
 * Every field is read from the design's own records: the opening names its host
 * `boundary`, and that boundary names the one space it encloses or the two it
 * separates. An opening schedule row carries the place of its first occurrence
 * only, so other members of the row may stand elsewhere.
 */
export interface IAutoMovieDrawingOpeningPlace {
  /** Discriminant naming the subject this place describes. */
  kind: "opening";

  /**
   * Building unit owning every space the host boundary separates, or `null`
   * when those spaces belong to different units, since a boundary between two
   * units belongs to neither alone.
   */
  building: string | null;

  /** Boundary hosting the opening. */
  boundary: string;

  /**
   * Spaces the host boundary encloses or separates, ascending.
   *
   * One entry where the boundary encloses a single space and two where it
   * stands between a pair; never empty, because the schedule validates the
   * design first and validation refuses a boundary that cites no space.
   */
  separates: string[];
}
