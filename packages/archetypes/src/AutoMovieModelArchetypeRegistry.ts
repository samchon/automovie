import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";

/**
 * Every archetype one host may build, keyed by the id a recipe names.
 *
 * A read-only map is the whole seam: the production core looks an archetype up
 * and reports the recipe when nothing answers, while a host decides what it
 * registered.
 *
 * Keys are exact, case-sensitive ids. Any `Map` satisfies this type, so the
 * blank-id and duplicate refusals, and the rule that each key is its
 * definition's own `id`, hold only for a registry built by
 * `createAutoMovieArchetypeRegistry`.
 *
 * @evidence contracts/common.md#principled-implementation The registry is the standard `ReadonlyMap` keyed by exact id, so lookup is the built-in hashed `get` and the read-only view keeps the design gate, the radius table and the materializer from mutating a host's catalogue.
 * @evidence contracts/common.md#clear-and-simple-design An alias rather than a class keeps the seam to one lookup type every consumer already understands, and the integrity rules live in the single factory instead of a wrapper type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias admits any map, and the comment states that the blank-id, duplicate and key-equals-id guarantees therefore come from the factory instead of claiming the type enforces them.
 * @evidence contracts/common.md#meaningful-documentation The prose names the consumers' lookup role, the exact-key rule, and which guarantees hold only for a factory-built registry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The alias declares no runtime code; the hashed map it names is built by `createAutoMovieArchetypeRegistry` or the host.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type only names the lookup; the production default registry is created once at module load and shared by reference, a decision owned by that constant.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Whoever builds the map owns it and its references to definitions; the type owns no state of its own.
 * @author Samchon
 */
export type AutoMovieModelArchetypeRegistry = ReadonlyMap<
  string,
  IAutoMovieModelArchetype
>;
