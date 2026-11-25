/** Saved curve and interval ownership for an appended engine chunk. */

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
