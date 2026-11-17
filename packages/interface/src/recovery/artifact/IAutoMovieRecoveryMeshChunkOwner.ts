/**
 * Saved curve and interval ownership for an appended engine chunk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable generated ordinary run identity. First saved section ordinal owned by this run.
 * @evidence contracts/development/design.md#principled-representation First saved section ordinal owned by this run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface createAutoMovieRecoveryMeshSpool share IAutoMovieRecoveryMeshChunkOwner's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
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
