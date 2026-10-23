/**
 * Renders thrown values without losing unexpected diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Return Error.message for Error instances and String conversion for other thrown values.
 * @evidence contracts/common.md#clear-and-simple-design One renderer preserves diagnostics without deciding failure policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected values remain visible rather than being replaced by assumed error shapes.
 * @evidence contracts/common.md#meaningful-documentation The comment describes retaining unexpected diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Native errors expose a field; other values incur their String conversion and output cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Each caught value is converted locally without cached error history.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No thrown value is retained after its string is returned.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
