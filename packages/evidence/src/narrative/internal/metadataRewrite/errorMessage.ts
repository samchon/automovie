/**
 * Renders thrown values without losing unexpected diagnostics.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Return Error.message for Error instances and String conversion for other thrown values.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One renderer preserves diagnostics without deciding failure policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unexpected values remain visible rather than being replaced by assumed error shapes.
 * @evidence contracts/development/common.md#meaningful-documentation The comment describes retaining unexpected diagnostics.
 * @evidence contracts/development/implementation.md#efficient-algorithms Native errors expose a field; other values incur their String conversion and output cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each caught value is converted locally without cached error history.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No thrown value is retained after its string is returned.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
