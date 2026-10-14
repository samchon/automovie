import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";
import { PRIMITIVE_PROP_ARCHETYPE } from "./PRIMITIVE_PROP_ARCHETYPE";
import { STICKMAN_ARCHETYPE } from "./STICKMAN_ARCHETYPE";
/**
 * The primitive archetypes this package ships, in registration order.
 *
 * A host can register this list, compose it with other definitions, or supply a different catalogue. The production package creates its default registry from these two entries once at module load.
 *
 * The module retains this two-reference array for its lifetime. Readonly prevents typed array edits; the definitions themselves remain shared mutable records, so consumers must not modify them. Registry ownership and duplicate-id admission belong to createAutoMovieArchetypeRegistry and its caller.
 *
 * @author Samchon
 */
export const AUTOMOVIE_PRIMITIVE_ARCHETYPES: readonly IAutoMovieModelArchetype[] =
  [STICKMAN_ARCHETYPE, PRIMITIVE_PROP_ARCHETYPE];
