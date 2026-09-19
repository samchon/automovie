/**
 * The instanced slot one entry addresses.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMaskSlot` as the portable data boundary for the rendering identity mask channels requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMaskSlot` for the spec render pass products system contract.
 */
export interface IAutoMovieSemanticMaskSlot {
  /**
   * Compiled instance-set id.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `instanceSet` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `instanceSet` for the spec render pass products system contract.
   */
  instanceSet: string;

  /**
   * Zero-based deterministic slot index inside that set.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `index` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `index` for the spec render pass products system contract.
   */
  index: number;
}
