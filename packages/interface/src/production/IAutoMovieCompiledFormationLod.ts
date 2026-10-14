/**
 * One camera-selected runtime representation for a compiled population. A resolvable canonically encodable model group digest covers its parts, skeleton and materials; a missing or unencodable group instead hashes an explicit identity marker.
 *
 * @evidence contracts/common.md#principled-implementation selectFormationLod compares distance scaled by projected pixel size against table-order thresholds; ascending positive thresholds and a final null are caller premises. compiledLodModelDigest hashes the canonical model group or a missing/unencodable marker, so the digest alone does not establish that a model was admitted or materialized.
 * @evidence contracts/common.md#clear-and-simple-design Semantic tier, distance bound, model group identity and resolved runtime model separate authored representation choice from the concrete runtime object consumed by the viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A group id alone cannot certify changed geometry or materials, and no camera-distance selection invents a model absent from the compiled representation table.
 * @evidence contracts/common.md#meaningful-documentation Gives near-to-far tier meaning, positive maximum metre distance and terminal null, model group identity and compiler-owned runtime model reference.
 * @author Samchon
 */
export interface IAutoMovieCompiledFormationLod {
  /** Semantic near-to-far tier. */
  tier: "hero" | "near" | "far";

  /** Positive maximum distance, or null only for the final tier. */
  maxDistance: number | null;

  /** Model group id the population design names for this tier. */
  recipe: string;

  /** Canonical digest of the referenced model group, including parts, skeleton and materials, or the producer's explicit missing/unencodable reference marker digest. */
  recipeDigest: string;

  /** Compiler-owned runtime model id. */
  model: string;
}
