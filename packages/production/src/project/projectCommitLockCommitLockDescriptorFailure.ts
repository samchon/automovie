

/**
 * The primary value thrown while reading a lock descriptor, supplied to its finally-close boundary so a later close error cannot replace it.
 *
 * @evidence contracts/common.md#principled-implementation unknown preserves any thrown value without falsely narrowing it to Error; the close boundary composes it with actual cleanup failure.
 * @evidence contracts/common.md#clear-and-simple-design A single optional record distinguishes no primary failure from a thrown undefined value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fabricate a read success or drop a non-Error cause; aggregation remains at the descriptor owner.
 * @evidence contracts/common.md#meaningful-documentation States why the error field is unknown and why record presence, rather than error truthiness, represents failure.
 * @evidence contracts/performance.md#efficient-algorithms This record performs no computation; aggregation copies cause references at the close helper.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the original thrown reference within one finally scope and introduces no error cache or retry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one thrown value until close completion; the descriptor remains owned by the reader and no handle transfers through this record.
 * @author Samchon
 */
export interface projectCommitLockCommitLockDescriptorFailure {
  /** Original thrown value, including a non-Error or undefined value. */
  error: unknown;
}
