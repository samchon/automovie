

/**
 * A token read from a witnessed regular file together with its device/inode identity. The snapshot describes one finite observation and cannot prove that a resident path stays unchanged afterward.
 *
 * @evidence contracts/common.md#principled-implementation Pairing token with opened-file identity gives reclaim/release both witnesses needed to compare subsequent observations.
 * @evidence contracts/common.md#clear-and-simple-design One small record crosses the descriptor-reader boundary, avoiding independently retained token and identity observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record is not an age-based or path-only ownership claim; only the reader supplies its physical witnesses.
 * @evidence contracts/common.md#meaningful-documentation States the token/identity pairing and finite-observation limitation rather than promising an atomic filesystem transaction.
 * @evidence contracts/performance.md#efficient-algorithms This representation has no algorithm; reading T token bytes and constructing identity strings is counted by the snapshot reader.
 * @evidence contracts/performance.md#reuse-equivalent-work Reclaim compares two exact snapshots within an attempt; this type does not cache resident observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two strings escape the reader and no descriptor transfers; callers retain snapshots for their current ownership decision.
 * @author Samchon
 */
export interface projectCommitLockCommitLockSnapshot {
  /** Device and inode of the witnessed regular file, separated by NUL. */
  identity: string;

  /** Complete resident token bytes decoded as UTF-8, compared without normalization. */
  token: string;
}
