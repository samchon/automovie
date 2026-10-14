import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "../contentIdentity";

/**
 * Hash one value through the canonical JSON byte owner.
 *
 * @evidence contracts/common.md#principled-implementation Canonical serialization precedes SHA-256 and propagates that owner's malformed-value refusal; mutable input must remain stable through this synchronous call.
 * @evidence contracts/common.md#clear-and-simple-design Basis, frame and track identity use the same canonical byte/hash owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A canonical digest does not prove complete dependency accounting or physical byte acquisition.
 * @evidence contracts/common.md#meaningful-documentation States canonical JSON framing and returned digest rather than media verification.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete object traversal/key ordering, UTF-8 serialization and hashing of B bytes; the input and encoded buffer coexist.
 * @evidence contracts/performance.md#reuse-equivalent-work One encoded buffer serves this hash without a second JSON serialization or a retained value cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The encoded buffer expires after the digest returns; this function acquires no native descriptor or task.
 */
export const productionPublicationDigestValue: (value: unknown) => string = (value: unknown): string => digestAutoMovieBytes(canonicalAutoMovieJsonBytes(value));
