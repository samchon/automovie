/**
 * One camera-selected runtime representation for a compiled population. A resolvable canonically encodable recipe digest covers geometry and palette parameters; missing or unencodable recipes instead hash an explicit identity marker.
 *
 * @evidence contracts/common.md#principled-implementation selectFormationLod compares distance scaled by projected pixel size against table-order thresholds; ascending positive thresholds and a final null are caller premises. compiledLodRecipeDigest hashes canonical recipe content or a missing/unencodable marker, so the digest alone does not establish that a model was admitted or materialized.
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

  /** Canonical recipe digest including geometry and palette, or the producer's explicit missing/unencodable reference marker digest. */
  recipeDigest: string;

  /** Compiler-owned runtime model id. */
  model: string;
}
