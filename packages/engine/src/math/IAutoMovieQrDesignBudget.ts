/**
 * Explicit allocation and transformed-cell ceilings for original-row QR.
 *
 * @evidence contracts/development/design.md#principled-representation Separate safe-integer entry/work limits admit input and retained original designs before orthogonal elimination, without supplying rank or numerical convergence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named generic algebra input is shared by the public row reducer and its recovery least-squares consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No missing limit, raised ceiling or regularizing rank claim supplies capacity.
 * @evidence contracts/development/common.md#meaningful-documentation Members state distinct matrix populations and conservative transformed-cell units.
 */
export interface IAutoMovieQrDesignBudget {
  /** Positive safe-integer ceiling for input entries and retained upper-plus-right entries, separately. */
  maxEntries: number;

  /** Positive safe-integer ceiling on the admitted m*n*(n+1) transformed-cell bound. */
  maxWork: number;
}
