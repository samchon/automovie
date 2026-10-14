import type { IHumanViewerPersonKeyDigest } from "./IHumanViewerPersonKeyDigest.js";

/**
 * The inputs of a person's numerical cache key.
 *
 * @evidence contracts/common.md#principled-implementation Forms the canonical JSON tuple of original document, both basis digests and face/body/person source digests for SHA-256 numerical identity.
 * @evidence contracts/common.md#clear-and-simple-design Separates numerical dependencies from camera, output frame size and source-frame write authorization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tuple boundaries prevent ambiguous string concatenation, but finite digest output is not a proof that collisions are impossible or schemas admitted.
 * @evidence contracts/common.md#meaningful-documentation Documents unknown original JSON and separate paired basis/source authority, with full Person admission remaining downstream.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input record performs no digest; tuple serialization/hash cost is linear in document and authority text.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal tuples produce equal keys for downstream numerical reuse; display-only parameters intentionally do not invalidate model identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stateless key owner borrows these inputs and retains only the returned digest, without storing documents or geometry across calls.
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
