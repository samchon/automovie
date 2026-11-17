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
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous metre residuals in stable row order for borrowed world poses. Keep dimensions invariant and do not mutate poses; exceptions abort fitting. The row retains its fit inputs only for its owning fit's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows and the documented reader/caller lifetime own retained data and release.
     */ measure: (poses: IAutoMoviePoses) => number[];
    /**
     * Frozen local model at an accepted configuration.
     *
     * Build a synchronous probe model at one accepted world pose, freezing its local witnesses. Its metre residual dimension/order must match measure; trial poses are borrowed and must stay unchanged. The owning fit releases this closure after use.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Build a synchronous probe model at one accepted world pose, freezing its local witnesses. Its metre residual dimension/order must match measure; trial poses are borrowed and must stay unchanged. The owning fit releases this closure after use.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; physicalContactBindingRows/physicalContactSupportRows and linearizePhysicalTargetRows and the documented reader/caller lifetime own retained data and release.
     */ linearize: (
      poses: IAutoMoviePoses,
    ) => (probe: IAutoMoviePoses) => number[];
  }
}
