/**
 * One camera-selected runtime representation for a compiled population. A
 * resolvable canonically encodable model group digest covers its parts,
 * skeleton and materials; a missing or unencodable group instead hashes an
 * explicit identity marker.
 */
export interface IAutoMovieCompiledFormationLod {
  /** Semantic near-to-far tier. */
  tier: "hero" | "near" | "far";

  /** Positive maximum distance, or null only for the final tier. */
  maxDistance: number | null;

  /** Model group id the population design names for this tier. */
  model: string;

  /**
   * Canonical digest of the referenced model group, including parts, skeleton
   * and materials, or the producer's explicit missing/unencodable reference
   * marker digest.
   */
  modelDigest: string;

  /**
   * Compiler-owned runtime model id derived from `model`; viewers and render
   * gates look the runtime model up by it.
   */
  runtimeModel: string;
}
