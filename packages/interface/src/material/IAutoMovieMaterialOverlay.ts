import { AutoMovieTextureBinding } from "./AutoMovieTextureBinding";

/**
 * An ordered colour and optional relief layer over a material, with independently authored image sampling.
 *
 * Colour alpha times `strength` controls colour, optional roughness and replacement-normal coverage. Multiply normals instead add strength-scaled XY to the existing tangent normal and multiply their Z components before normalization; this branch ignores colour alpha and can change an existing normal even at zero strength. glTF has no counterpart. These shader formulas do not prove a physical response or observed appearance.
 *
 * @evidence contracts/common.md#principled-implementation Ordered colour/roughness and replacement normals use alpha-times-strength coverage. Multiply normals use whiteout composition with strength-scaled XY and retained sampled Z, independently of colour alpha; zero strength therefore does not universally preserve an existing normal.
 * @evidence contracts/common.md#clear-and-simple-design Each overlay owns its image, blend, optional colour and relief factors and strength; the enclosing material owns list order and the four-layer budget, while texture references reuse the normal material sampling representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No use selects a special shader branch; the same multiply or replace rule applies to any authored image, and an unavailable colour image applies no overlay instead of fabricating coverage.
 * @evidence contracts/common.md#meaningful-documentation Defines colour coverage, edge texels, ordered blend formulas, multiply-normal alpha/zero-strength limits, finite factors and defaults, and the missing glTF counterpart without a physical-response guarantee.
 */
export interface IAutoMovieMaterialOverlay {
  /**
   * The layer's sRGB colour with alpha controlling colour, roughness and replacement-normal coverage; alpha zero does not suppress multiply normals. Filtering blends colour and coverage separately, so edge padding should carry the replacement colour or white tint as appropriate.
   */
  baseColorTexture: AutoMovieTextureBinding;

  /**
   * How the layer's colour meets the material's where it covers: `multiply` tints the base colour by it, `replace` substitutes it.
   */
  blend: "multiply" | "replace";

  /**
   * Linear RGB factors on the colour image's colour, each finite and nonnegative, so one image serves surfaces of different colouring; omitted, one.
   */
  colorFactor?: { r: number; g: number; b: number };

  /** Roughness where the layer covers, `[0, 1]`; omitted, the material's. */
  roughness?: number;

  /**
   * Optional tangent-space normal map. Multiply blends scale XY by `normalScale * strength`, add existing XY and multiply sampled Z, ignoring colour alpha. Replace blends scale XY by `normalScale` and interpolate normalized directions by coverage. Without an existing normal map, the viewer supplies a conventional flat map as the tangent-frame prerequisite.
   */
  normalTexture?: AutoMovieTextureBinding | null;

  /**
   * Strength of `normalTexture`'s slopes, a nonnegative finite factor; omitted, one.
   */
  normalScale?: number;

  /**
   * Finite factor in `[0, 1]` scaling colour/roughness/replacement-normal coverage and multiply-normal XY. At zero, multiply-normal Z can still change an existing tilted normal; this is not a universal disable switch.
   */
  strength: number;
}
