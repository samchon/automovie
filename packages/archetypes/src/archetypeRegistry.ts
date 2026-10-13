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
