/**
 * A file that was written, read back, and verified in the captured parent.
 *
 * @evidence contracts/common.md#principled-implementation Completion is reported only after the adapter's descriptor write, sync, readback, and parent-identity checks, so the outcome is a fact observed through the held handle rather than a pathname assumption.
 * @evidence contracts/common.md#clear-and-simple-design The variant carries the captured parent generation and completion discriminator, exactly what the candidate receipt records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both producers verify the child through held descriptors before returning; the outcome retains the consumed parent identity and no unread diagnostic field.
 * @evidence contracts/common.md#meaningful-documentation The comment states the verification behind completion and that parent identity names the captured directory generation retained by the receipt.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This completed variant is a two-field record with no algorithm; the verification cost belongs to the adapter that produces it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A completion record shares nothing across requests; each one describes exactly one file write.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds the parent identity string and no descriptor, because the adapter closes the file before reporting completion.
 */
export interface IScaffoldCompletedFilePublicationOutcome {
  /**
   * Identity of the captured parent directory containing the verified created or rewritten file; must be non-empty.
   */
  parentIdentity: string;

  /** Discriminator: the file is complete. */
  status: "completed";
}
