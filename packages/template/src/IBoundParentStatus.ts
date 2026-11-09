/**
 * Whether the held parent is a directory, and its physical identity.
 *
 * @evidence contracts/development/design.md#principled-representation A directory predicate and device-and-inode-equivalent identity describe the parent handle actually opened.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two fields provide the exact pre-create comparison against the earlier directory capture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A lexical pathname or matching label cannot substitute for held-parent physical identity.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish directory qualification from captured-generation identity.
 */
export interface IBoundParentStatus {
  /** Whether the held handle names a directory rather than a child file or unsupported entry. */
  directory: boolean;

  /** Device-and-inode-equivalent generation of the held parent, compared with the original directory capture. */
  identity: string;
}
