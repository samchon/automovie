/**
 * Where an opening is: the boundary hosting it and the spaces that boundary
 * separates.
 *
 * Every field is read from the design's own records: the opening names its
 * host `boundary`, and that boundary names the one space it encloses or the
 * two it separates. An opening schedule row carries the place of its first
 * occurrence only, so other members of the row may stand elsewhere.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` looks up the host boundary, copies and sorts its spaces with `compareAutoMovieRenderIds`, and resolves each with `builtEnvironmentBuildingOfSpace`, naming a unit only when every space resolves to the same one.
 * @evidence contracts/common.md#clear-and-simple-design The `kind` discriminant lets the schedule place union narrow to this variant, and the variant holds only the two lookups an opening's location needs instead of the room fields that do not apply to a void.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A boundary straddling two building units yields `null` rather than the first unit, so the derivation never picks an owner it has no rule for.
 * @evidence contracts/common.md#meaningful-documentation States where each field comes from and that a type row carries only its first occurrence's place; members give when `building` is `null`, the ascending order and the one-or-two count of `separates`.
 * @author Samchon
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
