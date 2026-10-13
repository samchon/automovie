import type { IAutoMovieHumanBodySkinChromophore } from "./IAutoMovieHumanBodySkinChromophore";

/**
 * The table a body's skin tone heterogeneity is generated from: one square
 * tile of the skin surface, over which the two chromophores that colour skin,
 * melanin and haemoglobin, vary about their site mean, and the variation's
 * growth with age.
 *
 * @evidence contracts/common.md#principled-implementation A seeded physical tile contains separate melanin and haemoglobin variations and an authored age strength curve.
 * @evidence contracts/common.md#clear-and-simple-design Shared tile geometry remains separate from each chromophore's spectral and spatial parameters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Procedural variation is repeatable but does not establish an individual's measured pigment distribution.
 * @evidence contracts/common.md#meaningful-documentation Members state tile scale, pixel resolution, chromophore ownership and age interpolation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The skin tone field table is a data type with no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The skin tone field table declaration performs no request coordination or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The skin tone field table schema owns no runtime resource acquisition or release.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinTone {
  /** Seed of both chromophore fields. */
  seed: number;

  /** Texels along each side of the square tile. */
  pixels: number;

  /** Physical side of the tile, millimetres. */
  tileMillimetres: number;

  /** Melanin, the epidermal pigment. */
  melanin: IAutoMovieHumanBodySkinChromophore;

  /** Haemoglobin, the dermal blood. */
  haemoglobin: IAutoMovieHumanBodySkinChromophore;

  /**
   * The variation's strength by the document's `macroAge` weight, `[weight,
   * factor]` points, piecewise linear and held at the ends: skin tone grows
   * less even with age.
   */
  age: [number, number][];
}
