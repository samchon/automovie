

/**
 * Immutable request-prefix claim held before an external repaint side effect.
 *
 * The project transaction compares request/prefix identity, ordinal and claim generation against resident state before reservation. The service uses attempt ordinal as this claim counter; it is separate from the project transaction revision. This mutable TypeScript record is not itself a lock, runtime freeze or provider dispatch authorization.
 *
 * @evidence contracts/common.md#principled-implementation Versioned production/shot/request/attempt identities and SHA-256 prefix/request digests bind a one-based attempt reservation to the request's claim-generation sequence independently of project revision.
 * @evidence contracts/common.md#clear-and-simple-design The record carries reservation operands while the project transaction and execution lane own atomic admission and provider effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Merely constructing this record acquires no reservation and cannot bypass current prefix/generation or active-owner checks.
 * @evidence contracts/common.md#meaningful-documentation Members identify namespace, request/attempt, one-based ordinal, prefix/generation and exact UTC claim instant; prose separates mutable data from acquired ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The claim shape executes no prefix hash, resident comparison or transaction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Claim identity declares no cache or in-flight provider coordinator; the transaction owns currentness and exclusivity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface acquires no lock or provider task; actual stored claims and transaction handles have runtime owners.
 * @author Samchon
 */
export interface IAutoMovieRepaintAttemptClaim {
  /** Claim schema version. */
  version: 1;

  /** Production namespace the claimed request belongs to. */
  productionId: string;

  /** Shot whose repaint request this attempt extends. */
  shot: string;

  /** Stable identity of the request being attempted. */
  requestId: string;

  /** Digest of the exact request the claim was admitted against. */
  requestFingerprint: string;

  /** One-based position of this attempt within its request. */
  attemptOrdinal: number;

  /** Stable identity of the attempt the claim reserves. */
  attemptId: string;

  /** Digest of the attempt prefix that must still be current when the side effect settles. */
  prefixDigest: string;

  /** Positive claim-generation counter; a later resident claim requires previous+1, and the service supplies attempt ordinal rather than project revision. */
  generation: number;

  /** ISO-8601 UTC instant the claim was admitted. */
  claimedAt: string;
}
