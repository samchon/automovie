import { currentAutoMovieLocalProcessOwner } from "./currentAutoMovieLocalProcessOwner";
import { projectCommitLockOwnerPrefix } from "./projectCommitLockOwnerPrefix";

/** Acquisition nonce retained by this token producer; no explicit number-precision limit is enforced. */
let lockNonce: number = 0;

/**
 * Encode this process's host/PID/generation, epoch-millisecond acquisition time and monotonically advanced local nonce in one prefixed JSON token.
 *
 * @evidence contracts/common.md#principled-implementation Canonical local process identity plus acquisition time and a local nonce distinguish ordinary acquisitions; release still compares the complete token rather than timestamp or PID alone.
 * @evidence contracts/common.md#clear-and-simple-design The token producer keeps its nonce private in this module, and shares protocol spelling with the parser while the acquisition owner performs exclusive publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture-specific owner or age-based authority is encoded; nonce uses a JavaScript number and has no explicit wrap or precision-limit refusal.
 * @evidence contracts/common.md#meaningful-documentation Names process identity, timestamp and nonce roles, plus the nonce precision limitation rather than claiming unlimited uniqueness.
 * @evidence contracts/performance.md#efficient-algorithms Serializes the fixed owner field set in O(H+G+N) characters for host, generation and nonce, with output-sized temporary string storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Current-process identity is supplied by its canonical provider; every token advances the nonce because distinct acquisition effects must not share a token.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One numeric nonce remains for this module's lifetime, while token strings belong to their lock owner and hold no handles or asynchronous work.
 */
export const projectCommitLockCommitLockToken: () => string = (): string => {
  const owner: ReturnType<typeof currentAutoMovieLocalProcessOwner> = currentAutoMovieLocalProcessOwner();
  return `${projectCommitLockOwnerPrefix}${JSON.stringify({
    ...owner,
    at: Date.now(),
    nonce: (lockNonce++).toString(36),
  })}`;
};
