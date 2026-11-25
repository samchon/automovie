/** One owner's share of one measured subject. */
export interface IAutoMovieQuantityContributor {
  /**
   * Design id the quantity is attributed to, chosen by the subject: a space for
   * floor area and volume, an opening for opening area, a connector for length,
   * an element kind or opening kind for those counts, and a model for model
   * occurrences.
   */
  owner: string;

  /**
   * Everything attributed to that owner, in the finding's unit, rounded to six
   * decimals.
   */
  value: number;
}
