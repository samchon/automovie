import type { IAutoMovieRecoveryMeshSections } from "../../index";

/**
 * Gather saved open-run metadata without preempting its local numerical refusal. Known names and confirmed fit misses remain literal observations. Missing fit fields are counted separately; an incomplete estimate inventory has no maximum.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Ordered saved coefficient identities used by this continuation run. Observed admission failures and qualification limits in production order; an empty array adds no extra certificate.
 * @evidence contracts/development/design.md#principled-representation Saved fits lacking a qualified finite nonnegative source-polyline estimate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface describeRecoveryOpenRun, reconstructRecoveryOpen share IAutoMovieRecoveryOpenRunDescriptionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Observed admission failures and qualification limits in production order; an empty array adds no extra certificate.
 */

export namespace IAutoMovieRecoveryOpenRunDescriptionOperation {
  /**
   * Gather saved open-run metadata without preempting its local numerical refusal. Known names and confirmed fit misses remain literal observations. Missing fit fields are counted separately; an incomplete estimate inventory has no maximum.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Ordered saved coefficient identities used by this continuation run. Observed admission failures and qualification limits in production order; an empty array adds no extra certificate.
   * @evidence contracts/development/design.md#principled-representation Saved fits lacking a qualified finite nonnegative source-polyline estimate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface describeRecoveryOpenRun, reconstructRecoveryOpen share IAutoMovieRecoveryOpenRunDescriptionOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Observed admission failures and qualification limits in production order; an empty array adds no extra certificate.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    nodes: readonly {
      /** Saved-section ordinal in the input observation sequence. */
      section: number;
      /** Open-arc ordinal in the addressed saved section's report. */
      arc: number;
    }[],
  ) => {
    /** Ordered saved coefficient identities used by this continuation run. */
    curves: string[];

    /** Observed admission failures and qualification limits in production order; an empty array adds no extra certificate. */
    diagnostics: string[];

    /** Saved course fits whose recorded positional tolerance was not met. */
    fitTargetMisses: number;

    /** Saved fits lacking a qualified finite nonnegative source-polyline estimate. */
    unqualifiedFitMetadata: number;

    /** Maximum saved finite-polyline upper estimate in millimetres; null if any required estimate is unavailable. */
    fitPolylineUpperEstimateMaximumMm: number | null;

    /** Recorded source cubic-span population, or null when the required metadata is unavailable. */
    sourceSpans: number | null;
  };
}
