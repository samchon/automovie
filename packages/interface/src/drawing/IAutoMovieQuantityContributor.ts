/**
 * One owner's share of one measured subject.
 *
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` accumulates each subject in a map keyed by owner, and `finish` rounds every owner's sum to six decimals before ranking, so contributors and the finding's total are built from the same rounded values.
 * @evidence contracts/common.md#clear-and-simple-design Owner and value only, because the enclosing finding already states subject and unit; which id namespace `owner` uses is decided by that subject.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Owners are the subject's own keys with nothing merged or renamed; floor area is attributed to the space because a surface binding has no id of its own, a limit the report declares as a `surface-identity` gap.
 * @evidence contracts/common.md#meaningful-documentation Names which id `owner` holds for each subject family and that `value` uses the subject's unit at six-decimal precision.
 * @author Samchon
 */
export interface IAutoMovieQuantityContributor {
  /**
   * Design id the quantity is attributed to, chosen by the subject: a space
   * for floor area and volume, an opening for opening area, a connector for
   * length, an element or opening kind for those counts, and a model for
   * model occurrences.
   */
  owner: string;

  /** That owner's contribution in the subject's unit, to six decimals. */
  value: number;
}
