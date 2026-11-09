/**
 * Saved curve and interval ownership for an appended engine chunk.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryMeshChunkOwner {
  /** Stable generated ordinary run identity. */
  run: string;

  /** First saved section ordinal owned by this run. */
  firstSection: number;

  /** Ordered saved curve coefficient names. */
  curves: readonly string[];

  /** Saved pair ordinals for the run intervals. */
  pairs: readonly number[];
}
