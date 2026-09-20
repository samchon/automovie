import { IAutoMovieTextureReference } from "./IAutoMovieTextureReference";

/**
 * Legacy bare asset id or the complete texture sampling declaration.
 *
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-texture-coordinates-scale Exposes `AutoMovieTextureBinding` as the portable data boundary for the asset texture coordinates scale requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Types `AutoMovieTextureBinding` for the asset spec material texture relations system contract.
 */
export type AutoMovieTextureBinding = string | IAutoMovieTextureReference;
