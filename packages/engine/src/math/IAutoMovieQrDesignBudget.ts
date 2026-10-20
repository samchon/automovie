/**
 * Explicit allocation and transformed-cell ceilings for original-row QR.
 *
 * @evidence contracts/common.md#principled-implementation Separate safe-integer entry/work limits admit input and retained original designs before orthogonal elimination, without supplying rank or numerical convergence.
 * @evidence contracts/common.md#clear-and-simple-design One named generic algebra input is shared by the public row reducer and its recovery least-squares consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing limit, raised ceiling or regularizing rank claim supplies capacity.
 * @evidence contracts/common.md#meaningful-documentation Members state distinct matrix populations and conservative transformed-cell units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased budget performs no factorization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache or effect sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar limits acquire no resource.
 */
export interface IAutoMovieQrDesignBudget {
  /** Positive safe-integer ceiling for input entries and retained upper-plus-right entries, separately. */
  maxEntries: number;

  /** Positive safe-integer ceiling on the admitted m*n*(n+1) transformed-cell bound. */
  maxWork: number;
}
