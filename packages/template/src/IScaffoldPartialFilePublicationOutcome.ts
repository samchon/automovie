/**
 * A file slot that exists in the captured parent but is not complete.
 *
 * The publisher never deletes it, because a deletion through a pathname could reach a different file than the one it created.
 *
 * @evidence contracts/common.md#principled-implementation An exclusive reservation, including an unusable returned handle, or a truncation of an existing resident makes later failures partial; the parent identity and confirmed byte count describe that file effect without claiming completion.
 * @evidence contracts/common.md#clear-and-simple-design This variant distinguishes file effects requiring recovery from a refusal before target-file mutation; directory preparation remains outside the per-file outcome.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cleanup or retry hides the partial slot; the documentation states that deletion is deliberately left to the caller.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the slot exists, why it is not deleted, the byte count's meaning and bound, and which parent generation contains it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The partial variant reports a count and an identity and computes neither.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A partial slot is the effect of one write; there is no equivalent work to share with another.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record acquires no handle; the adapter attempts release before reporting and preserves any close failure, which cannot establish that the native handle was released.
 * @author Samchon
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
