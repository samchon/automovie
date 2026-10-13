

/**
 * Trim and collapse whitespace before lowercasing a target title for duplicate identity admission.
 *
 * @evidence contracts/common.md#principled-implementation Trim and collapse whitespace before lowercasing a target title for duplicate identity admission.
 * @evidence contracts/common.md#clear-and-simple-design Anchor and title registries enforce independent uniqueness dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This identity normalization does not grade prose or infer semantic equality beyond normalized spelling.
 * @evidence contracts/common.md#meaningful-documentation The normalized string is an internal duplicate key rather than a displayed title.
 * @evidence contracts/performance.md#efficient-algorithms Whitespace replacement and case conversion scan the title and allocate normalized text.
 * @evidence contracts/performance.md#reuse-equivalent-work The resulting key is reused by the owning registry for its validation pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper keeps no title population; only the caller's identity map retains keys.
 */
export function normalizeTargetTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/gu, " ");
}
