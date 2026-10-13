import { IAutoMovieDestructibleTrait } from "./IAutoMovieDestructibleTrait";
import { IAutoMovieMountableTrait } from "./IAutoMovieMountableTrait";

/**
 * Declarative profile capabilities; every variant is data, never code.
 *
 * Discriminated on `kind`. A profile holds at most one trait of each kind,
 * which `validateProfileCapabilities` and the production design lint enforce.
 * Locomotion is not a trait; it is the profile's `gaits` field.
 *
 * @evidence contracts/common.md#principled-implementation A closed union discriminated on `kind`, so a capability is proved by narrowing to one variant rather than by matching a model name or a free-form label.
 * @evidence contracts/common.md#clear-and-simple-design Two variants, one per capability the validators check, and a new capability is a new variant rather than a flag on an existing one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both validators branch on `kind` alone and refuse a repeated kind instead of letting a later trait override an earlier one.
 * @evidence contracts/common.md#meaningful-documentation States the discriminant, the one-per-kind rule and its two enforcers, and that locomotion lives in `gaits` instead.
 * @author Samchon
 */
export type IAutoMovieProfileTrait =
  | IAutoMovieMountableTrait
  | IAutoMovieDestructibleTrait;
