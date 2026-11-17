/**
 * Record definitions for the normalized outline registry. Types describe
 * source metadata and kept observations; they neither evaluate a curve nor
 * validate the recorded numbers at runtime. The registry preserves its
 * existing qualified type names as aliases of these definitions.
 *
 * @evidence contracts/common.md#principled-implementation Models sparse station observations separately from fixed mass-footprint summaries; each record carries its own reading and normalization metadata.
 * @evidence contracts/common.md#clear-and-simple-design Owns the three shared record definitions once, keeping the data registry below its file limit without moving runtime data or functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Introduces no geometry, fitted value, new observation or alternate runtime validator.
 * @evidence contracts/common.md#meaningful-documentation States the records' provenance fields, sparse-cell meaning and lack of runtime validation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type-only namespace chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased record declarations perform no computation to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declarations allocate and retain no runtime object or handle.
 */

export {};
