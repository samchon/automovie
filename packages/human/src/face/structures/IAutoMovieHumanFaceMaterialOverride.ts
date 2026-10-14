import type { IAutoMovieHumanFaceMaterialRgb } from "./IAutoMovieHumanFaceMaterialRgb";

/**
 * Appearance edits to one existing facial source material.
 *
 * Base colour and roughness retain their normalized source-material meaning.
 * Fibre pigment and density require source coverage registration: the card
 * consumer paints their alpha texture, while numerical shafts use the same
 * pigment and an explicitly qualified opacity-gain conversion. Density is
 * neither a shaft count nor a geometric growth control. Omission retains the
 * corresponding source value; no mean complexion or pigment is supplied.
 *
 * @evidence contracts/common.md#principled-implementation The builder clones existing source materials, replaces supplied linear base colour/roughness, and delegates registered fibre pigment and coverage to the card or generated-shaft finish owner.
 * @evidence contracts/common.md#clear-and-simple-design Optional complete RGB, roughness, fibre pigment and density separate ordinary finish edits from source coverage appearance; omitted values preserve their corresponding source input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing material IDs and finite normalized optical values are required; density gains card alpha while generated lash/brow opacity is capped at unit gain, so density neither changes shaft count nor establishes follicle density.
 * @evidence contracts/common.md#meaningful-documentation Linear channels, source coverage requirement and qualified card-to-solid opacity conversion identify the actual appearance approximation without supplying mean biological values.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no texture decoding, recolouring or mesh generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fibre painter owns decoded-source and latest-result reuse, not this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller overrides create no retained image, material clone or GPU resource here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMaterialOverride {
  /** Complete linear RGB override, each channel in [0,1]. */
  color?: IAutoMovieHumanFaceMaterialRgb;

  /** Surface roughness in [0,1], independent from base colour. */
  roughness?: number;

  /** Fibre linear RGB pigment in [0,1], requiring registered source coverage. */
  pigment?: [number, number, number];

  /** Coverage gain in [0,4], distinct from explicit numerical shaft count. */
  density?: number;
}
