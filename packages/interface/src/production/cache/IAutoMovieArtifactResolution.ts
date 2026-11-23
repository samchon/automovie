/** The artifact `resolveAutoMovieArtifact` returns, and how it was obtained. */
export interface IAutoMovieArtifactResolution {
  /** The artifact's bytes, owned by the caller. */
  bytes: Uint8Array;

  /**
   * `sha256:` content digest of `bytes`; declare it as a downstream key input
   * for early cutoff.
   */
  digest: string;

  /**
   * - `reused`: a stored entry passed content verification and nothing ran.
   * - `computed`: no entry existed; the computation ran and was stored.
   * - `repaired`: a stored entry failed content verification, was removed,
   *   recomputed and stored.
   * - `verified`: verification was requested; the recomputation matched the
   *   stored entry.
   * - `mismatched`: verification was requested and the recomputation differed;
   *   the stored entry was replaced. The stage is nondeterministic or its key
   *   misses an input.
   */
  outcome: "reused" | "computed" | "repaired" | "verified" | "mismatched";
}
