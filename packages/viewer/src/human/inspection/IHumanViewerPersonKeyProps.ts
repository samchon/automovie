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
 * @author Samchon
 */
export interface IHumanViewerPersonKeyProps {
  /** The person document JSON as read. */
  document: unknown;

  /**
   * Digests of the face and body bases (or of one candidate packet for both).
   */
  bases: Record<"face" | "body", IHumanViewerPersonKeyDigest>;

  /** Digest of the source each domain's build reads. */
  sources: Record<"face" | "body" | "person", string>;
}
