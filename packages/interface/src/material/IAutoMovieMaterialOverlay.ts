import { AutoMovieTextureBinding } from "./AutoMovieTextureBinding";

/**
 * A surface layer composited over a material where its own image covers: a
 * tissue or a marking the material's maps do not carry, placed once across
 * the surface rather than tiled with them, such as the veins under a skin or
 * the nail plates at its fingertips.
 *
 * Its colour image carries the layer's colour and, in alpha, its coverage.
 * Where it covers, the layer multiplies the material's base colour (a tint,
 * such as the absorption over a vein) or replaces it (another tissue, such as
 * a nail plate), and sets its own roughness if it names one. A tint's normal
 * map adds its slopes to the material's; a replacing layer's replaces the
 * material's normal, so the tissue under it does not show through.
 * `strength` scales the coverage and a tint's slopes together, so one image
 * serves every intensity. glTF has no ratified
 * extension for it, so an exported asset omits its overlays.
 *
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `IAutoMovieMaterialOverlay` as the portable data boundary for the asset material composition requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `IAutoMovieMaterialOverlay` for the asset spec material texture relations system contract.
 * @author Samchon
 */
export interface IAutoMovieMaterialOverlay {
  /**
   * The layer's colour in sRGB with its coverage in alpha, 0 where the
   * material shows through unchanged. Filtering blends colour and coverage
   * apart, so an uncovered texel beside a covered one should carry the
   * colour the edge fades into: a replacing layer's own colour carried past
   * its edge, white for a tint.
   *
   * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `baseColorTexture` as the portable data boundary for the asset material composition requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `baseColorTexture` for the asset spec material texture relations system contract.
   */
  baseColorTexture: AutoMovieTextureBinding;

  /**
   * How the layer's colour meets the material's where it covers: `multiply`
   * tints the base colour by it, `replace` substitutes it.
   *
   * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `blend` as the portable data boundary for the asset material composition requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `blend` for the asset spec material texture relations system contract.
   */
  blend: "multiply" | "replace";

  /**
   * Roughness where the layer covers, `[0, 1]`; omitted, the material's.
   *
   * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `roughness` as the portable data boundary for the asset material composition requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `roughness` for the asset spec material texture relations system contract.
   */
  roughness?: number;

  /**
   * Optional tangent-space normal map, scaled by `normalScale`. A `multiply`
   * layer's slopes, times `strength` too, add to the material's (whiteout
   * blending); a `replace` layer's normal replaces the material's by its
   * coverage. On a material without a normal map it bends the surface's own
   * normal.
   *
   * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `normalTexture` as the portable data boundary for the asset material composition requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `normalTexture` for the asset spec material texture relations system contract.
   */
  normalTexture?: AutoMovieTextureBinding | null;

  /**
   * Strength of `normalTexture`'s slopes, a nonnegative finite factor;
   * omitted, one.
   *
   * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `normalScale` as the portable data boundary for the asset material composition requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `normalScale` for the asset spec material texture relations system contract.
   */
  normalScale?: number;

  /**
   * How much of the layer shows, `[0, 1]`: its coverage and a tint's slopes
   * are scaled by it, and at 0 the material is as if it had no overlay.
   *
   * @evidence requirements/asset-authoring/materials-and-textures.md#asset-material-composition Exposes `strength` as the portable data boundary for the asset material composition requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `strength` for the asset spec material texture relations system contract.
   */
  strength: number;
}
