/**
 * Why a report no longer describes the target in front of a consumer.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Records the concrete target difference that invalidates prior render evidence.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Makes freshness failure actionable without treating a changed target as equivalent.
 */
export interface IAutoMovieRenderTargetDrift {
  /**
   * What changed: the renderer, one setting, or one asset's bytes.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Identifies the dependency field whose revision made the report stale.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Locates drift within the renderer, settings, or asset closure.
   */
  field: string;
  /**
   * The value the report was measured against.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Preserves the target value bound into the prior evidence.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Retains the reported side of a target-identity comparison.
   */
  reported: string;
  /**
   * The value the current target carries.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Exposes the replacement value that requires remeasurement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Retains the current side of a target-identity comparison.
   */
  current: string;
}
