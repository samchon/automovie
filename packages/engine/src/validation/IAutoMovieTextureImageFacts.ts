import { AutoMovieTextureMediaType } from "./AutoMovieTextureMediaType";

/**
 * Image facts read from an asset's own bytes, never from its file name.
 *
 * A manifest can claim anything; a PNG signature cannot. The builder hands
 * these in so this validator stays a pure function of facts, and so the same
 * closure runs against probed bytes in the builder and against fixed facts in
 * a test.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `IAutoMovieTextureImageFacts` carries the byte-proven format and dimensions used to validate a sampled surface image.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `IAutoMovieTextureImageFacts` provides the observed image facts required to reject unresolved or incompatible surface resources.
 */
export interface IAutoMovieTextureImageFacts {
  /**
   * IANA media type the bytes themselves prove.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `mediaType` records the IANA image format proved by the asset bytes before channel use is accepted.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `mediaType` supplies the observed container identity checked against the texture or environment consumer's accepted set.
   */
  mediaType: AutoMovieTextureMediaType;
  /**
   * Pixel width, a positive integer.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `width` records the byte-proven horizontal pixel count used to detect an unusable surface image.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `width` provides the measured edge checked for positivity and the portable sampling limit.
   */
  width: number;
  /**
   * Pixel height, a positive integer.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `height` records the byte-proven vertical pixel count used to detect an unusable surface image.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `height` provides the independent vertical edge measurement enforced before model output is accepted.
   */
  height: number;
}
