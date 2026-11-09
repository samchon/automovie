/**
 * Observed host memory peaks, independent of enforced allocation limits.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryMemoryPeaks {
  /** Observed managed heap peak in bytes. */
  heap: number;

  /** Observed resident memory peak in bytes. */
  rss: number;
}
