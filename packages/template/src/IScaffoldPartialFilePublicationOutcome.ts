/**
 * A file slot that exists in the captured parent but is not complete.
 *
 * The publisher never deletes it, because a deletion through a pathname could reach a different file than the one it created.
 *
 * @evidence contracts/development/design.md#principled-representation An exclusive reservation, including an unusable returned handle, or a truncation of an existing resident makes later failures partial; the parent identity and confirmed byte count describe that file effect without claiming completion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This variant distinguishes file effects requiring recovery from a refusal before target-file mutation; directory preparation remains outside the per-file outcome.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cleanup or retry hides the partial slot; the documentation states that deletion is deliberately left to the caller.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that the slot exists, why it is not deleted, the byte count's meaning and bound, and which parent generation contains it.
 */
export interface IScaffoldPartialFilePublicationOutcome {
  /**
   * Bytes confirmed written to the slot, from 0 to the entry's byte length.
   */
  bytesWritten: number;

  /** Original native or validation error, kept for the caller. */
  error: unknown;

  /** Identity of the captured parent directory containing the partial slot. */
  parentIdentity: string;

  /** Discriminator: a slot exists with incomplete or unverified content. */
  status: "partial";
}
