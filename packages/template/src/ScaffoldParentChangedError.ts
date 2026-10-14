/**
 * The requested parent cannot be opened as the captured directory, or its held handle reports a different directory identity.
 *
 * @evidence contracts/common.md#principled-implementation A distinct Error subtype classifies missing or invalid parent paths reported by the native open adapters and directory or identity mismatches reported by the held-parent inspection, all before child creation.
 * @evidence contracts/common.md#clear-and-simple-design The error carries the existing message and standard cause chain, with one stable name used for the pre-create refusal decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native missing-path and invalid-directory errors retain their parent-changed classification even when no handle was acquired; inspection mismatches are reported without retrying another pathname.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes failure to open the requested parent from a mismatch observed through an opened handle, and the constructor preserves standard ErrorOptions causes.
 * @evidence contracts/performance.md#efficient-algorithms One Error is allocated; inherited stack capture depends on the runtime and does not traverse scaffold contents.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parent failure is a separate observation and no error instance is shared across publication attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the error and any cause chain; no file or directory handle is acquired by construction.
 */
export class ScaffoldParentChangedError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ScaffoldParentChangedError";
  }
}
