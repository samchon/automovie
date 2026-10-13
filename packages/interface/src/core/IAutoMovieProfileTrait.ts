import { IAutoMovieDestructibleTrait } from "./IAutoMovieDestructibleTrait";
import { IAutoMovieMountableTrait } from "./IAutoMovieMountableTrait";

/**
 * Declarative profile capabilities; every variant is data, never code.
 *
 * Discriminated on `kind`. A profile holds at most one trait of each kind,
 * which `validateProfileCapabilities` and the production design lint enforce.
 * Locomotion is not a trait; it is the profile's `gaits` field.
 *
 * @author Samchon
 */
export type IAutoMovieProfileTrait =
  | IAutoMovieMountableTrait
  | IAutoMovieDestructibleTrait;
