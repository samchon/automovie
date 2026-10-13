/**
 * One owner's share of one measured subject.
 *
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` accumulates each subject's values in a map keyed by owner, so an owner appears once per finding with the sum of everything attributed to it, rounded to six decimals.
 * @evidence contracts/common.md#clear-and-simple-design An owner id and a value are all a take-off line needs; the unit and basis live once on the enclosing finding instead of being repeated per contributor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Owners are the design ids the subject attributes to, with no merged or synthetic owner standing in for the remainder; what the bound leaves out is counted on the finding instead.
 * @evidence contracts/common.md#meaningful-documentation States which design id owns each subject's share, that one owner's shares are summed, and the value's unit and rounding.
 * @author Samchon
 */
export interface IAutoMovieQuantityContributor {
  /**
   * Design id the quantity is attributed to, chosen by the subject: a space
   * for floor area and volume, an opening for opening area, a connector for
   * length, an element kind or opening kind for those counts, and a model for
   * model occurrences.
   */
  owner: string;

  /**
   * Everything attributed to that owner, in the finding's unit, rounded to six
   * decimals.
   */
  value: number;
}
