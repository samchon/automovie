import type { IAutoMovieDestructibleTrait } from "./IAutoMovieDestructibleTrait";
import type { IAutoMovieMountableTrait } from "./IAutoMovieMountableTrait";

/**
 * Declarative profile capabilities; every variant is data, never code.
 *
 * Discriminated on kind. validateProfileCapabilities, called by validateModel
 * and production design admission, checks at most one trait of each kind and
 * each variant's ranges. Locomotion remains the profile's gaits field.
 */
export type IAutoMovieProfileTrait =
  | IAutoMovieMountableTrait
  | IAutoMovieDestructibleTrait;
