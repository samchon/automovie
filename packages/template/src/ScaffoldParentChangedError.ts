/**
 * The held parent no longer names the captured directory.
 *
 * @evidence contracts/common.md#principled-implementation A distinct Error subtype lets the coordinator classify a changed parent before any child slot exists.
 * @evidence contracts/common.md#clear-and-simple-design The error carries the existing message and standard cause chain, with one stable name used for the pre-create refusal decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The subtype reports an observed parent mismatch rather than retrying the publication against another path.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies the held-parent generation failure and the constructor preserves standard ErrorOptions causes.
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
