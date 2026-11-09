/**
 * The requested parent cannot be opened as the captured directory, or its held handle reports a different directory identity.
 *
 * @evidence contracts/development/design.md#principled-representation A distinct Error subtype classifies missing or invalid parent paths reported by the native open adapters and directory or identity mismatches reported by the held-parent inspection, all before child creation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The error carries the existing message and standard cause chain, with one stable name used for the pre-create refusal decision.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Native missing-path and invalid-directory errors retain their parent-changed classification even when no handle was acquired; inspection mismatches are reported without retrying another pathname.
 * @evidence contracts/development/common.md#meaningful-documentation The prose distinguishes failure to open the requested parent from a mismatch observed through an opened handle, and the constructor preserves standard ErrorOptions causes.
 */
export class ScaffoldParentChangedError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ScaffoldParentChangedError";
  }
}
