/**
 * Runtime agreement between a semantic palette and the scene actually drawn.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMaskCoverage` as the portable data boundary for complete structural evidence.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMaskCoverage` for the semantic render-product closure.
 */
export interface IAutoMovieSemanticMaskCoverage {
  /** Declared drawable ids absent from the built scene, in ascending order. */
  unresolved: string[];
  /** Built meshes that the palette could not name. */
  unaddressed: number;
}
