/**
 * The largest edge a portable target is required to sample.
 *
 * WebGL 2 guarantees `MAX_TEXTURE_SIZE >= 2048` and desktop GPUs report 16384,
 * but a 16k tile is not a finish decision, it is a download nobody meant to
 * ship. 8192 is the widest edge every currently targeted browser/GPU pair in
 * this project's capture matrix samples without a driver-side rescale, so it is
 * the bound a production is held to rather than the bound a driver happens to
 * allow.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation `AUTO_MOVIE_MAX_TEXTURE_EDGE` fixes the largest image dimension accepted by the portable surface-sampling contract.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures `AUTO_MOVIE_MAX_TEXTURE_EDGE` supplies the expected bound reported beside an oversized width or height observation.
 */
export const AUTO_MOVIE_MAX_TEXTURE_EDGE = 8192;
