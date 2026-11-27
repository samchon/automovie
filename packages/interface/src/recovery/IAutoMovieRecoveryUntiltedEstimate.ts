/** Borrowed original-row dual of this model's qualified untilted affine QP. */
export interface IAutoMovieRecoveryUntiltedEstimate {
  /** Current original physical tangent width. */
  readonly width: number;

  /** Current complete original row count, including objective row zero. */
  readonly rowCount: number;

  /** Increasing original inequality IDs, excluding zero; empty is qualified. */
  readonly selected: readonly number[];

  /** Finite nonnegative original untilted multipliers in selected-ID order. */
  readonly multipliers: readonly number[];
}
