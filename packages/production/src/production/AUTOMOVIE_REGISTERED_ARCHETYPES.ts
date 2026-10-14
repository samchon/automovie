import {
  AUTOMOVIE_PRIMITIVE_ARCHETYPES,
  AutoMovieModelArchetypeRegistry,
  createAutoMovieArchetypeRegistry,
} from "@automovie/archetypes";

/**
 * Default archetype registry constructed once from the primitive catalogue.
 *
 * The production project passes this registry to design validation and materialization unless its caller supplies another registry. Those owners resolve recipe names through the supplied registry and diagnose unsupported names; this constant adds no recipe-specific fallback.
 *
 * Module initialization includes the registry factory's complete catalogue validation and index construction, and the returned registry remains resident with its catalogue references for the module lifetime. A previous model evaluation is not cached here. This ordinary value is not a native function/type Evidence host.
 */
export const AUTOMOVIE_REGISTERED_ARCHETYPES: AutoMovieModelArchetypeRegistry =
  createAutoMovieArchetypeRegistry(AUTOMOVIE_PRIMITIVE_ARCHETYPES);
