/**
 * A file that was written, read back, and verified in the captured parent.
 *
 * @evidence contracts/development/design.md#principled-representation Completion is reported only after the adapter's descriptor write, sync, readback, and parent-identity checks, so the outcome is a fact observed through the held handle rather than a pathname assumption.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The variant carries the captured parent generation and completion discriminator, exactly what the candidate receipt records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both producers verify the child through held descriptors before returning; the outcome retains the consumed parent identity and no unread diagnostic field.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the verification behind completion and that parent identity names the captured directory generation retained by the receipt.
 */
export interface IScaffoldCompletedFilePublicationOutcome {
  /**
   * Identity of the captured parent directory containing the verified created or rewritten file; must be non-empty.
   */
  parentIdentity: string;

  /** Discriminator: the file is complete. */
  status: "completed";
}
