import { IAutoMovieModelRecipe } from "@automovie/interface";
/**
 * One recipe's exact parameter map, keyed by parameter name.
 *
 * The alias does not imply acceptance: `build` receives a map the design gate
 * accepted, while `plan` always and `projectionRadius` possibly receive one the
 * gate has not judged, which is why `numberOf` exists beside the casting
 * readers.
 *
 * @evidence contracts/common.md#principled-implementation Derives the scalar union from IAutoMovieModelRecipe.parameters and exposes a Readonly view of the same record, so gate and materializer need no copy. Typed archetype members cannot assign its properties, but the recipe owner can still mutate the underlying record and must keep it stable during use.
 * @evidence contracts/common.md#clear-and-simple-design One alias names the map that `plan`, `projectionRadius` and the build input all take, and it derives from the recipe type instead of spelling the scalar union a second time.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds only `Readonly` to the recipe's map and narrows no key or value for any archetype.
 * @evidence contracts/common.md#meaningful-documentation The prose states that the type says nothing about acceptance and which members receive an accepted map versus an unjudged one.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias has no runtime code, so it selects no algorithm or data structure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This alias names a recipe-owned record that is passed by reference everywhere, so no work around it is duplicated.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The recipe graph owns the record this alias describes; the alias itself holds no data, handle or task.
 * @author Samchon
 */
export type AutoMovieArchetypeParameters = Readonly<
  IAutoMovieModelRecipe["parameters"]
>;
