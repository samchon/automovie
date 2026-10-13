/**
 * One owner's share of one measured subject.
 *
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
