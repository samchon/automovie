import { AutoMovieModelArchetypeRegistry } from "./AutoMovieModelArchetypeRegistry";
import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";

/**
 * Register one closed catalogue of archetypes for a host to build from.
 *
 * Registration is where a duplicate or blank id has to fail, because after it
 * the map answers one definition per id and nobody can tell which of two
 * builders a recipe reached.
 *
 * The iterable is consumed once, in order, and the first empty or whitespace-only id, or the first repeated id, throws an `Error` naming the correction, so a catalogue with several faults reports them one at a time. An id with surrounding whitespace is stored exactly as written.
 *
 * Definitions are retained by reference, without cloning, freezing or validating their functions and schemas; keep them unchanged while consumers use the registry.
 *
 * @param archetypes Definitions to register, consumed once in iteration order.
 * @returns A new map from each definition's own id to that definition.
 *
 * @evidence contracts/common.md#principled-implementation One pass inserts each definition under its own `id` after testing `trim()` for blankness and `Map.has` for a repeat, so the returned keys are exactly the definitions' ids and never a normalized variant.
 * @evidence contracts/common.md#clear-and-simple-design The function only validates and inserts; which definitions to register stays with the caller, such as the production package registering `AUTOMOVIE_PRIMITIVE_ARCHETYPES` as its default.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id is special-cased: both refusals apply to every definition, and throwing at the first fault is the documented fail-fast contract with no retry or recovery path.
 * @evidence contracts/common.md#meaningful-documentation States fail-fast order, blank and repeated ids, preserved whitespace, borrowed definitions and the schema/function stability that registration does not enforce.
 * @evidence contracts/performance.md#efficient-algorithms One pass performs trim plus native Map.has/set for each of N definitions. Total id length L bounds trimming work and temporary string length; retained space is N map entries, plus iterator-owned work and storage. Full traversal is required to detect a final duplicate or blank id, and custom iterable execution costs remain additional.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call registers the catalogue it is given into a fresh map; sharing one registry across hosts is the caller's decision, as the production default constant does.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new map transfers to the caller with one borrowed definition per registered id and no fixed catalogue cap. A refusal leaves no retained partial map; for-of closes a generator on abrupt exit, while any iterable-owned external cleanup remains that iterable's responsibility.
 * @author Samchon
 */
export const createAutoMovieArchetypeRegistry: (
  archetypes: Iterable<IAutoMovieModelArchetype>,
) => AutoMovieModelArchetypeRegistry = (
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
