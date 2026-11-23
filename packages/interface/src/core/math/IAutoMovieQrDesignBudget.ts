/** Explicit allocation and transformed-cell ceilings for original-row QR. */
export interface IAutoMovieQrDesignBudget {
  /**
   * Positive safe-integer ceiling for input entries and retained
   * upper-plus-right entries, separately.
   */
  maxEntries: number;

  /**
   * Positive safe-integer ceiling on the admitted m_n_(n+1) transformed-cell
   * bound.
   */
  maxWork: number;
}
