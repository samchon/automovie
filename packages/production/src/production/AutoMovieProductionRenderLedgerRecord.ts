/**
 * Distinguish aggregate render manifest and renderer receipt at JSON admission.
 *
 * @evidence contracts/common.md#principled-implementation The closed union names two persisted record families; their schemas and later publication comparisons remain distinct owners.
 * @evidence contracts/common.md#clear-and-simple-design One label connects schema-result projection to its typed Error without a runtime registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A record label alone grants no ownership or currentness; delivery validation checks matching bytes and identities separately.
 * @evidence contracts/common.md#meaningful-documentation Identifies manifest versus receipt without treating mere presence as publication proof.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union executes no decoding or validation traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type retains no result or cross-read equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no bytes, descriptors or tasks.
 */
export type AutoMovieProductionRenderLedgerRecord = "render-manifest" | "render-manifest-receipt";
