/**
 * Whether the held parent is a directory, and its physical identity.
 *
 * @evidence contracts/common.md#principled-implementation A directory predicate and device-and-inode-equivalent identity describe the parent handle actually opened.
 * @evidence contracts/common.md#clear-and-simple-design The two fields provide the exact pre-create comparison against the earlier directory capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A lexical pathname or matching label cannot substitute for held-parent physical identity.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish directory qualification from captured-generation identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The held parent status record declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held parent status record type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held parent status record schema acquires no runtime handles, bytes or tasks.
 */
export interface IBoundParentStatus {
  /** Whether the held handle names a directory rather than a child file or unsupported entry. */
  directory: boolean;

  /** Device-and-inode-equivalent generation of the held parent, compared with the original directory capture. */
  identity: string;
}
