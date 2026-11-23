import type { IAutoMovieTextureReference } from "./IAutoMovieTextureReference";

/**
 * Asset id with slot defaults, or an explicit texture sampling declaration.
 *
 * A bare id leaves color space to the material slot and makes no
 * coordinate-source claim. Use the structured form to select transforms and
 * samplers.
 */
export type AutoMovieTextureBinding = string | IAutoMovieTextureReference;
