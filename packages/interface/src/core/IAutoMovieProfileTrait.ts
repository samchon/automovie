import { IAutoMovieDestructibleTrait } from "./IAutoMovieDestructibleTrait";
import { IAutoMovieMountableTrait } from "./IAutoMovieMountableTrait";

/**
 * Declarative profile capabilities; every variant is data, never code.
 *
 * Discriminated on `kind`. A profile holds at most one trait of each kind,
 * which `validateProfileCapabilities` (called by `validateModel`) and the
 * production design lint enforce together with each variant's ranges.
 * Locomotion is not a trait; it is the profile's `gaits` field.
 *
 * @evidence contracts/common.md#principled-implementation A closed discriminated union on `kind`, so each validator branches exhaustively and checks the variant's own fields, such as integer seats within `[1, 1024]` or restitution within `[0, 1]`, and a set of seen kinds refuses a repeat.
 * @evidence contracts/common.md#clear-and-simple-design Each capability keeps its fields on its own variant and the union only names the set, so adding a capability is one new variant rather than optional fields on a shared record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Locomotion stays on `gaits` rather than being duplicated as a marker trait, and no capability is inferred from a model or profile name.
 * @evidence contracts/common.md#meaningful-documentation States the discriminant, the one-per-kind rule and which validators enforce it, and that locomotion lives elsewhere.
 * @author Samchon
 */
export type IAutoMovieProfileTrait =
  | IAutoMovieMountableTrait
  | IAutoMovieDestructibleTrait;
