
/**
 * One camera-selected runtime representation for a compiled population. Recipe digest covers the current geometry and palette parameters, not only its name.
 *
 * @evidence contracts/common.md#principled-implementation Ordered distance thresholds select a runtime model backed by the exact recipe digest; a null terminal threshold represents the unbounded final distance interval rather than a guessed far cutoff.
 * @evidence contracts/common.md#clear-and-simple-design Semantic tier, distance bound, recipe identity and resolved model separate authored representation choice from the concrete runtime object consumed by the viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recipe id alone cannot certify changed geometry or palette, and no camera-distance selection invents a model absent from the compiled representation table.
 * @evidence contracts/common.md#meaningful-documentation Gives near-to-far tier meaning, positive maximum metre distance and terminal null, recipe parameter identity and compiler-owned runtime model reference.
 * @author Samchon
 */
export interface IAutoMovieCompiledFormationLod {
  /** Semantic near-to-far tier. */
  tier: "hero" | "near" | "far";

  /** Positive maximum distance, or null only for the final tier. */
  maxDistance: number | null;

  /** Design recipe id. */
  recipe: string;

  /** Exact current recipe digest, including geometry and palette parameters. */
  recipeDigest: string;

  /** Compiler-owned runtime model id. */
  model: string;
}
