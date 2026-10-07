/** Named selections over an immutable historical source, not personal geometry.
 * Native IDs and coordinates are derived from that source's correspondence.
 * @author Samchon
 */
export interface IHumanSourceGuideRecipe {
  /** Discriminant for the maintained source-selection recipe. */
  schema: "automovie-source-guide-recipe/1";

  /** Exact Git revision that owns both original historical artifacts. */
  revision: string;

  /** Repository logical path to the original compressed head view. */
  headPath: string;

  /** Digest of the original compressed bytes, not a recompressed derivative. */
  headSha256: string;

  /** Immutable historical registration receipt used by native ear port export. */
  manifestPath: string;

  /** Digest of the original registration receipt, before any selection. */
  manifestSha256: string;

  /** Historical named landmarks whose native correspondence is retained. */
  baseLandmarks: string[];

  /** Additional historical nasal landmarks; no fitted personal measurements. */
  nasalLandmarks: string[];

  /** Filled historical regions owned by the pinned head and attachment receipt. */
  earRegions: string[];

  /** Sparse regions owned by the maintained sample-selection declaration. */
  sampleRegions: string[];

  /** Work-relative CC0 native mirror table used by the sparse-selection owner. */
  mirrorPath: string;

  /** Exact mirror bytes required before reflecting the maintained right samples. */
  mirrorSha256: string;

  /** Source acquisition and unresolved authored-selection limitations. */
  qualification: string;
}
