import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation A `ReadonlyMap` keyed by the exact id string gives constant-time lookup under SameValueZero key equality, so no case folding or trimming can make two ids collide.
 * @evidence contracts/common.md#clear-and-simple-design A type alias over the standard map interface with no wrapper class; lookup, key listing for diagnostics and iteration use the built-in API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defines no fallback archetype: the gate reports `model-archetype-unregistered`, the materializer throws, and the radius table answers null; a hand-built map whose key differs from its definition's `id` would still satisfy the type.
 * @evidence contracts/common.md#meaningful-documentation States the lookup-and-report split, the exact key semantics, and that the factory's invariants are not implied by the type alone.
 * @evidence contracts/performance.md#cost-and-resources Each recipe costs one hash lookup in the gate, the materializer and the radius table; the only full pass is the sorted key list the gate prints when an archetype is unregistered. `AUTOMOVIE_REGISTERED_ARCHETYPES` is built once at module load and is the default registry of the gate, the materializer, the radius table and the production project, so registration is not repeated per call; the map object's identity decides sharing, and its entries never change after registration. Retains a strong reference to every registered definition for as long as its holder keeps the map, which for the shipped registry is the process lifetime; size is the catalogue length (two shipped definitions), and no handle is held.
 * @author Samchon
 */
export type AutoMovieModelArchetypeRegistry = ReadonlyMap<
  string,
  IAutoMovieModelArchetype
>;

/**
 *
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
 * @evidence contracts/common.md#principled-implementation One pass that tests `id.trim()` for emptiness and `Map.has` before each `set`, so uniqueness is decided by the map's own exact key equality.
 * @evidence contracts/common.md#clear-and-simple-design Validation sits at the single place a registry is constructed, and the result is returned as the plain read-only map type rather than a registry class.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a duplicate instead of resolving it first-wins or last-wins, and trims only to test blankness without rewriting the stored id.
 * @evidence contracts/common.md#meaningful-documentation States why registration is the failure point, the single in-order consumption of the iterable, the fail-fast reporting, and the untrimmed storage.
 * @evidence contracts/performance.md#cost-and-resources Linear in catalogue length with one `trim` and one hash probe per definition, and no sort or second pass. Each call registers its caller's catalogue into a new map that caller keeps; the server registry calls it once at module load, so no registration is repeated. The returned map retains one reference per definition and nothing else; a throw partway leaves the partial map unreachable to any caller.
 * @author Samchon
 */
export const createAutoMovieArchetypeRegistry = (
  archetypes: Iterable<IAutoMovieModelArchetype>,
): AutoMovieModelArchetypeRegistry => {
  const registry = new Map<string, IAutoMovieModelArchetype>();
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
