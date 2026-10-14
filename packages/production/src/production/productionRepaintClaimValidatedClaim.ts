import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import { IAutoMovieRepaintAttemptClaim } from "./IAutoMovieRepaintAttemptClaim";

/**
 * Admit claim identity fields and return a detached copy. Complete schema and resident ownership remain project responsibilities; enumerable extras are not rejected here and structuredClone may refuse unsupported captured values.
 *
 * @evidence contracts/common.md#principled-implementation Version, exact nonblank identity text, shared SHA-256 syntax, positive safe counters and exact UTC roundtrip precede structured cloning without changing the source claim.
 * @evidence contracts/common.md#clear-and-simple-design Claim-field admission serves the public assertion while transaction currentness and dispatch stay with project/execution owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest syntax alone proves no current prefix, and this typed boundary is not an exact-key schema validator or provider ownership grant.
 * @evidence contracts/common.md#meaningful-documentation Prose states detached-copy ownership, unvalidated extras, possible clone failures and the resident transaction boundary.
 * @evidence contracts/performance.md#efficient-algorithms Text/digest scans and Date roundtrip precede cloning the actual complete object graph; the current public assertion discards that clone, preserving an existing allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current mutable metadata is independently admitted; no previously acquired request or clone result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned detached graph belongs to the caller; local text/date temporaries expire and the helper retains no supplied claim or transaction resource.
 */
export const productionRepaintClaimValidatedClaim: (claim: IAutoMovieRepaintAttemptClaim) => IAutoMovieRepaintAttemptClaim = (
  claim: IAutoMovieRepaintAttemptClaim,
): IAutoMovieRepaintAttemptClaim => {
  if (
    claim.version !== 1 ||
    [claim.productionId, claim.shot, claim.requestId, claim.attemptId].some(
      (value: string): boolean =>
        typeof value !== "string" ||
        value.trim().length === 0 ||
        value !== value.trim(),
    ) ||
    SHA256_DIGEST_PATTERN.test(claim.requestFingerprint) === false ||
    SHA256_DIGEST_PATTERN.test(claim.prefixDigest) === false ||
    Number.isSafeInteger(claim.attemptOrdinal) === false ||
    claim.attemptOrdinal <= 0 ||
    Number.isSafeInteger(claim.generation) === false ||
    claim.generation <= 0
  )
    throw new Error("Repaint attempt claim identity is malformed.");
  const claimedAt: Date = new Date(claim.claimedAt);
  if (
    Number.isNaN(claimedAt.getTime()) ||
    claimedAt.toISOString() !== claim.claimedAt
  )
    throw new Error("Repaint attempt claim requires an exact UTC instant.");
  return structuredClone(claim);
};
