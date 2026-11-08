/**
 * The artifact `resolveAutoMovieArtifact` returns, and how it was obtained.
 *
 * @evidence contracts/development/design.md#principled-representation Bytes with their `sha256:` content digest, which is the value a downstream key should declare as its input for early cutoff, and a closed outcome naming whether the store, the computation or both produced them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns the result beside its resolver; Render's frame cache and production stage caches read the bytes, the digest for downstream keys and the outcome for their reports.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Outcomes are one union rather than flags, so a result cannot claim to be both reused and recomputed.
 * @evidence contracts/development/common.md#meaningful-documentation Defines each outcome and what the digest is for.
 */
export interface IAutoMovieArtifactResolution {
  /** The artifact's bytes, owned by the caller. */
  bytes: Uint8Array;

  /** `sha256:` content digest of `bytes`; declare it as a downstream key input for early cutoff. */
  digest: string;

  /**
   * - `reused`: a stored entry passed content verification and nothing ran.
   * - `computed`: no entry existed; the computation ran and was stored.
   * - `repaired`: a stored entry failed content verification, was removed, recomputed and stored.
   * - `verified`: verification was requested; the recomputation matched the stored entry.
   * - `mismatched`: verification was requested and the recomputation differed; the stored entry was replaced. The stage is nondeterministic or its key misses an input.
   */
  outcome: "reused" | "computed" | "repaired" | "verified" | "mismatched";
}
