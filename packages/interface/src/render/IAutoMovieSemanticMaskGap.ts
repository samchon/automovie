/**
 * One instance set whose per-slot colours were not allocated.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMaskGap` as the portable data boundary for the rendering identity mask channels requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMaskGap` for the spec render pass products system contract.
 */
export interface IAutoMovieSemanticMaskGap {
  /**
   * Compiled instance-set id.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `instanceSet` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `instanceSet` for the spec render pass products system contract.
   */
  instanceSet: string;

  /**
   * Slots that went unaddressed.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `slots` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `slots` for the spec render pass products system contract.
   */
  slots: number;

  /**
   * Exactly why they were not allocated.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `reason` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `reason` for the spec render pass products system contract.
   */
  reason: string;

  /**
   * Exactly what would allocate them.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `remedy` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `remedy` for the spec render pass products system contract.
   */
  remedy: string;
}
