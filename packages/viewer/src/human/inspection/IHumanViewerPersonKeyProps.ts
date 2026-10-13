import type { IHumanViewerPersonKeyDigest } from "./IHumanViewerPersonKeyDigest.js";

/**
 * The inputs of a person's numerical cache key.
 *
 * @evidence contracts/common.md#principled-implementation Every authority the composed build reads participates in the key.
 * @evidence contracts/common.md#meaningful-documentation Names each participating input.
 *
 * @evidence contracts/common.md#clear-and-simple-design The original document, both basis digests and all three numerical source digests form one cache-input contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A composed Person key cannot ignore face or body source changes or substitute a display-only revision.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Every authority the composed build reads participates in the key.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation A composed Person key cannot ignore face or body source changes or substitute a display-only revision.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonKeyProps {
  /**
   * The person document JSON as read.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Includes original Person JSON in numerical key composition without a display-only projection.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Includes original Person JSON in numerical key composition without a display-only projection.
   */
  document: unknown;

  /**
   * Digests of the face and body bases (or of one candidate packet for both).
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Includes both actual basis-byte authorities, or the same candidate packet authority when it supplies both.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Includes both actual basis-byte authorities, or the same candidate packet authority when it supplies both.
   */
  bases: Record<"face" | "body", IHumanViewerPersonKeyDigest>;

  /**
   * Digest of the source each domain's build reads.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Includes Face, Body and Person producer source so a composition change invalidates numerical reuse.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Includes Face, Body and Person producer source so a composition change invalidates numerical reuse.
   */
  sources: Record<"face" | "body" | "person", string>;
}
