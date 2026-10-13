import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";
/**
 * Everything a geometry builder needs beyond the recipe's own parameters.
 *
 * The materializer supplies it once per generated recipe, after the design gate
 * has accepted the parameter map.
 *
 * @evidence contracts/common.md#principled-implementation The compiler decides the material and skeleton ids and hands them in, so every builder references ids that match the compiled model's material list and runtime skeleton id instead of minting its own.
 * @evidence contracts/common.md#clear-and-simple-design The input carries only the accepted map and the two compiler-owned ids a builder writes into its geometry; the recipe id, palette decoding and model naming stay with the materializer, which alone uses them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is read by the shipped builders, primitive-prop ignoring only `skeleton` as the documented skeletonless case, and no field exists for a particular recipe or test.
 * @evidence contracts/common.md#meaningful-documentation Each member says who owns the value and how a builder uses it, including that `material` is named after the first palette swatch in code-unit order and that a skeletonless builder ignores `skeleton`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input is a three-field argument record and chooses no algorithm; building geometry from it is costed on `build`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The materializer creates one input per generated recipe and passes the recipe's own parameter record by reference, so no work is repeated that could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The argument object is dropped once `build` returns; only the parameter record it references outlives the call, owned by the recipe graph.
 * @author Samchon
 */
export interface IAutoMovieArchetypeBuildInput {
  /** Exact recipe parameter map, already accepted by the design gate. */
  parameters: AutoMovieArchetypeParameters;

  /**
   * Compiler-owned id of the model's only material, named after the recipe
   * palette's first swatch in code-unit order; every generated part references
   * it.
   */
  material: string;

  /**
   * Compiler-owned skeleton id for this recipe; an articulated builder uses it
   * as its skeleton id, and a builder returning no skeleton ignores it.
   */
  skeleton: string;
}
