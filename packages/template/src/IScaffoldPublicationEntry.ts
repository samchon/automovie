/**
 * One validated file of an immutable scaffold publication candidate.
 *
 * {@link planScaffoldPublication} builds and freezes every entry before any directory or file is touched, so the bytes and target a publisher receives are the ones that passed validation. `readonly` is compile-time only; the runtime immutability comes from those producers freezing the entry and its byte array.
 *
 * @evidence contracts/common.md#principled-implementation UTF-8 bytes use a frozen number array because a nonempty typed array cannot be frozen; planScaffoldPublication proves target containment lexically, and ensureScaffoldFileDirectory plus assertScaffoldOwnership qualify physical directory containment before writing.
 * @evidence contracts/common.md#clear-and-simple-design Fields separate content, diagnostics and destination: bytes feeds write and readback, relative names the entry in errors and receipts, and target selects the parent directory and child name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries no special case; the documentation states that freezing is done by the planner and `publishScaffoldCandidate`, not guaranteed by the `readonly` modifiers themselves.
 * @evidence contracts/common.md#meaningful-documentation The comment says who freezes the entry and when, the bytes' encoding, the relative path's diagnostic role, and that the target's containment is lexical at this stage.
 * @evidence contracts/performance.md#efficient-algorithms The byte array spends one array element per byte instead of one byte, a linear memory cost in file size that buys freezability; it is paid once by the planner per file.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A file entry is plain data and coordinates no work; reuse of whole frozen entries is decided by `publishScaffoldCandidate`.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The entry retains its byte array and two path strings while referenced directly, by a candidate, or by a receipt; storage grows with that file's byte and path lengths, and it owns no handle or task.
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
