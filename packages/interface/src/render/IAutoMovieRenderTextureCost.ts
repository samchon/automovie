/**
 * One unique texture asset and the device memory it is estimated to occupy.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `IAutoMovieRenderTextureCost` as the portable data boundary for the rendering texture decode requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `IAutoMovieRenderTextureCost` for the spec render material color system contract.
 */
export interface IAutoMovieRenderTextureCost {
  /**
   * Project asset id cited by a material binding.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `asset` as the portable data boundary for the rendering texture decode requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `asset` for the spec render material color system contract.
   */
  asset: string;

  /**
   * Material ids that bind this asset, ascending.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `materials` as the portable data boundary for the rendering texture decode requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `materials` for the spec render material color system contract.
   */
  materials: string[];

  /**
   * Estimated device bytes, or `null` when the asset's dimensions were not
   * supplied. A `null` here is what turns the `textureBytes` metric into
   * `not-run` instead of an invented number.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `bytes` as the portable data boundary for the rendering texture decode requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `bytes` for the spec render material color system contract.
   */
  bytes: number | null;
}
