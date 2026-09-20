/**
 * Every image container a texture or environment asset may actually be.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `AutoMovieTextureMediaType` enumerates the actual image containers whose channels can enter texture and environment validation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `AutoMovieTextureMediaType` bounds format interpretation to named byte containers instead of trusting a file extension.
 */
export type AutoMovieTextureMediaType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/vnd.radiance";
