import { AutoMovieModelArchetypeRegistry } from "./AutoMovieModelArchetypeRegistry";
import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";

/**
 * Register one closed catalogue of archetypes for a host to build from.
 *
 * Registration is where a duplicate or blank id has to fail, because after it
 * the map answers one definition per id and nobody can tell which of two
 * builders a recipe reached.
 *
 * The iterable is consumed once, in order, and the first empty or
 * whitespace-only id, or the first repeated id, throws an `Error` naming the
 * correction, so a catalogue with several faults reports them one at a time.
 * An id with surrounding whitespace is stored exactly as written.
 *
 * @param archetypes Definitions to register, consumed once in iteration order.
 * @returns A new map from each definition's own id to that definition.
 *
 * @evidence contracts/common.md#principled-implementation One pass inserts each definition under its own `id` after testing `trim()` for blankness and `Map.has` for a repeat, so the returned keys are exactly the definitions' ids and never a normalized variant.
 * @evidence contracts/common.md#clear-and-simple-design The function only validates and inserts; which definitions to register stays with the caller, such as the production package registering `AUTOMOVIE_PRIMITIVE_ARCHETYPES` as its default.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id is special-cased: both refusals apply to every definition, and throwing at the first fault is the documented fail-fast contract with no retry or recovery path.
 * @evidence contracts/common.md#meaningful-documentation The comment states why registration owns the refusals, the consumption order, which ids fail, that the first fault throws, and that whitespace around an id is preserved.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in the number of definitions, one `trim()` copy of the id and one hashed `has` and `set` each, and space is one map entry per definition; a single pass is required because every id must be checked.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call registers the catalogue it is given into a fresh map; sharing one registry across hosts is the caller's decision, as the production default constant does.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The map is acquired here and transferred to the caller at return, holding only references to the given definitions, bounded by the catalogue size; a thrown refusal drops the partial map, so nothing outlives a failure.
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
