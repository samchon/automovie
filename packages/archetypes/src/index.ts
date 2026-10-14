
/**
 * A catalogue of primitive model archetypes, behind one registration seam.
 *
 * A host selects definitions through a registry. This package supplies each definition's parameter schema with its bounds and a pure geometry builder.
 *
 * The gait tables live here for the same reason. The engine owns the gait
 * machinery, the phase/duty/amplitude/contact math that walks any jointed body;
 * which bones swing, at which phases, with which amplitudes is data about one
 * kind of body, so it belongs to the catalogue a host chooses.
 */
export * from "./AutoMovieArchetypeParameters";
export * from "./AutoMovieModelArchetypeRegistry";
export * from "./IAutoMovieArchetypeBuildInput";
export * from "./IAutoMovieArchetypeGeometry";
export * from "./IAutoMovieArchetypeParameter";
export * from "./IAutoMovieArchetypeParameterPlan";
export * from "./IAutoMovieArchetypeRefusal";
export * from "./IAutoMovieModelArchetype";
export * from "./CAT_GAITS";
export * from "./CAT_PROFILE";
export * from "./createAutoMovieArchetypeRegistry";
export * from "./HORSE_GAITS";
export * from "./HORSE_PROFILE";
export * from "./HUMANOID_GAITS";
export * from "./HUMANOID_PROFILE";
export * from "./numberOf";
export * from "./numberParameter";
export * from "./AUTOMOVIE_PRIMITIVE_ARCHETYPES";
export * from "./PRIMITIVE_PROP_ARCHETYPE";
export * from "./STICKMAN_ARCHETYPE";
export * from "./stringParameter";
