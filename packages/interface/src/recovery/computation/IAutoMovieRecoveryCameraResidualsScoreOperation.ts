/**
 * Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation at (N-1)*q. Empty support has null diagnostics, never a perfect zero error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation
 * @evidence contracts/development/design.md#principled-representation Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraEstimate, fitRecoveryEpipolarConsensus, fitRecoveryHomographyConsensus share IAutoMovieRecoveryCameraResidualsScoreOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraResidualsScoreOperation {
  /**
   * Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation at (N-1)*q. Empty support has null diagnostics, never a perfect zero error.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation
   * @evidence contracts/development/design.md#principled-representation Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation
   * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraEstimate, fitRecoveryEpipolarConsensus, fitRecoveryHomographyConsensus share IAutoMovieRecoveryCameraResidualsScoreOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    residuals: readonly (number | null)[],
    thresholdPx: number,
  ) => {
    /** Original correspondence ordinals passing the declared residual gate, in stable input order. */
    indices: number[];
    /** Median accepted residual in pixels, or null for an empty accepted population. */
    medianPx: number | null;
    /** Ninetieth-percentile accepted residual in pixels, or null for an empty accepted population. */
    p90Px: number | null;
  };
}
