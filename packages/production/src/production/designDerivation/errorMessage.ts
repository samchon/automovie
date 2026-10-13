/**
 * Render a caught derivation or subject-inspection cause for its outer explanation.
 *
 * @evidence contracts/common.md#principled-implementation Existing Error values contribute message; other thrown values use standard String conversion.
 * @evidence contracts/common.md#clear-and-simple-design One small normalization serves current-basis, canonical-output and the live subject-inspection refusal context without owning those operations' recovery or resource lifetimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts String conversion may execute caller-defined conversion and throw; this helper does not invent a successful fallback or suppress that failure.
 * @evidence contracts/common.md#meaningful-documentation States Error-message versus arbitrary-value conversion semantics and the effectful conversion premise.
 * @evidence contracts/performance.md#efficient-algorithms Reads one Error message or pays the supplied value's conversion/string allocation cost, not a constant-time guarantee for arbitrary objects.
 * @evidence contracts/performance.md#reuse-equivalent-work Each actual caught cause is rendered separately without cached conversion effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned text survives with the outer refusal; the original cause is not retained in an owned resource manager.
 */
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
