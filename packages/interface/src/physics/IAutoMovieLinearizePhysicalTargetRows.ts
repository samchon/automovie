import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";

/**
 * One residual group and its call-local witness model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines candidate-bone dependencies, exact acceptance residuals and frozen local witness callbacks.
 * @evidence contracts/development/design.md#principled-representation Residual vectors use metres and preserve dimensions across probes; rigidInvariant applies only to same-body separation under common rigid motion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalContactBindingRows and physicalContactSupportRows create these groups; linearizePhysicalTargetRows uses their dependency sets to reuse unaffected rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The explicit bone set must include every candidate dependency; external body poses remain fixed actual inputs, not silently refitted candidates.
 */
export namespace IAutoMovieLinearizePhysicalTargetRows {
  /**
   * One residual group and its call-local witness model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines candidate-bone dependencies, exact acceptance residuals and frozen local witness callbacks.
   * @evidence contracts/development/design.md#principled-representation Residual vectors use metres and preserve dimensions across probes; rigidInvariant applies only to same-body separation under common rigid motion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalContactBindingRows and physicalContactSupportRows create these groups; linearizePhysicalTargetRows uses their dependency sets to reuse unaffected rows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The explicit bone set must include every candidate dependency; external body poses remain fixed actual inputs, not silently refitted candidates.
   */
  export interface IRows {
    /** All candidate bones read by this group. External bodies remain actual. */ bones: ReadonlySet<string>;
    /** True only for intrinsic same-body separation, invariant under a common rigid motion. */ rigidInvariant?: boolean;
    /**
     * Exact nonlinear residuals used for acceptance.
     *
     * Synchronous metre residuals in stable row order for borrowed world poses. Keep dimensions invariant and do not mutate poses; exceptions abort fitting. The row retains its fit inputs only for its owning fit's lifetime.
     */ measure: (poses: IAutoMoviePoses) => number[];
    /**
     * Frozen local model at an accepted configuration.
     *
     * Build a synchronous probe model at one accepted world pose, freezing its local witnesses. Its metre residual dimension/order must match measure; trial poses are borrowed and must stay unchanged. The owning fit releases this closure after use.
     */ linearize: (
      poses: IAutoMoviePoses,
    ) => (probe: IAutoMoviePoses) => number[];
  }
}
