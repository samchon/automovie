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
 * @evidence contracts/common.md#principled-implementation The registry is the standard `ReadonlyMap` keyed by exact id, so lookup is the built-in hash lookup and the read-only view keeps the design gate, radius table and materializer from mutating a host's catalogue.
 * @evidence contracts/common.md#clear-and-simple-design An alias rather than a class keeps the seam to one lookup type every consumer already understands; the integrity rules live in the one factory instead of a wrapper type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias admits any map, and the documentation states that blank-id, duplicate and key-equals-id guarantees therefore depend on the factory instead of claiming the type enforces them.
 * @evidence contracts/common.md#meaningful-documentation The prose names the consumers' lookup role, the exact-key rule, and which guarantees hold only for a factory-built registry.
 * @evidenceExclude contracts/performance.md#cost-and-resources This alias is a type with no runtime code; the map it describes is built and owned by `createAutoMovieArchetypeRegistry` or the host.
 * @author Samchon
 */
export type AutoMovieModelArchetypeRegistry = ReadonlyMap<
  string,
  IAutoMovieModelArchetype
>;

/**
 * Register one closed catalogue of archetypes for a host to build from.
 *
 * Registration is where a duplicate or blank id has to fail, because after it
 * the map answers one definition per id and nobody can tell which of two
 * builders a recipe reached.
 *
 * The iterable is consumed once, in order, and the first whitespace-only or
 * repeated id throws an `Error` naming the correction, so a catalogue with
 * several faults reports them one at a time. An id with surrounding whitespace
 * is stored exactly as written.
 *
 * @param archetypes Definitions to register, consumed once in iteration order.
 * @returns A new map from each definition's own id to that definition.
 *
 * @evidence contracts/common.md#principled-implementation One pass inserts each definition under its own `id` after checking `trim()` for blankness and `Map.has` for a repeat, so the returned map's keys are exactly the definitions' ids and never a normalized variant.
 * @evidence contracts/common.md#clear-and-simple-design The function only validates and inserts; which definitions to register stays with the caller, such as the production server registering `AUTOMOVIE_PRIMITIVE_ARCHETYPES`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id is special-cased: the two refusals apply to every definition, and throwing at the first fault is the documented fail-fast contract rather than a retry or recovery path.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why registration owns the refusals, the consumption order, fail-at-first behavior, and that whitespace around an id is preserved.
 * @evidence contracts/performance.md#cost-and-resources Cost is one hash insertion and one `trim()` copy per definition, linear in catalogue size; the returned map is retained by the caller and holds only references to the given definitions.
 * @author Samchon
 */
export const createAutoMovieArchetypeRegistry = (
  archetypes: Iterable<IAutoMovieModelArchetype>,
): AutoMovieModelArchetypeRegistry => {
  const registry: Map<string, IAutoMovieModelArchetype> = new Map<
    string,
    IAutoMovieModelArchetype
  >();
  for (const archetype of archetypes) {
    if (archetype.id.trim().length === 0)
      throw new Error(
        "A model archetype id must contain non-whitespace text. Give every registered archetype the exact id its recipes name.",
      );
    if (registry.has(archetype.id))
      throw new Error(
        `Model archetype "${archetype.id}" is registered twice. Register one definition per id so a recipe cannot reach two builders.`,
      );
    registry.set(archetype.id, archetype);
  }
  return registry;
};
