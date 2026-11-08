/**
 * One validated file of an immutable scaffold publication candidate.
 *
 * {@link planScaffoldPublication} builds and freezes every entry before any directory or file is touched, so the bytes and target a publisher receives are the ones that passed validation. `readonly` is compile-time only; the runtime immutability comes from those producers freezing the entry and its byte array.
 *
 * @evidence contracts/development/design.md#principled-representation UTF-8 bytes use a frozen number array because a nonempty typed array cannot be frozen; planScaffoldPublication proves target containment lexically, and ensureScaffoldFileDirectory plus assertScaffoldOwnership qualify physical directory containment before writing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fields separate content, diagnostics and destination: bytes feeds write and readback, relative names the entry in errors and receipts, and target selects the parent directory and child name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record carries no special case; the documentation states that freezing is done by the planner and `publishScaffoldCandidate`, not guaranteed by the `readonly` modifiers themselves.
 * @evidence contracts/development/common.md#meaningful-documentation The comment says who freezes the entry and when, the bytes' encoding, the relative path's diagnostic role, and that the target's containment is lexical at this stage.
 */
export interface IScaffoldPublicationEntry {
  /** UTF-8 bytes of the file content, fixed before any mutation begins. */
  bytes: readonly number[];

  /** Map key exactly as authored, used in error messages and receipts. */
  relative: string;

  /**
   * Absolute target that lexically stays below the candidate root; links are checked only when its parent directory is captured.
   */
  target: string;
}
