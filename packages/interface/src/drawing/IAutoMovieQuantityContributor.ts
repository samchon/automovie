/** One owner's share of one measured subject. */
export interface IAutoMovieQuantityContributor {
  /**
   * Design id the quantity is attributed to: a space, opening, kind or model.
   */
  owner: string;

  /** That owner's exact contribution, in the subject's unit. */
  value: number;
}
