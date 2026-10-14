

/**
 * Persisted candidate or active-rendition inspection family. Candidate absence is reported at receipt and rendition absence at pointer; actual selection/byte currentness belongs to each record reader.
 *
 * @evidence contracts/common.md#principled-implementation The closed family union distinguishes candidate receipts from rendition pointers while retaining independent sibling inspection.
 * @evidence contracts/common.md#clear-and-simple-design Family choice supplies target routing without embedding filesystem paths or provider payloads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A candidate is not automatically an active rendition and family spelling establishes no resident validity.
 * @evidence contracts/common.md#meaningful-documentation Prose gives family-specific absence stages and the delegated currentness boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union performs no record enumeration or I/O.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Record-family spelling implements no inspection cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased type acquires no record bytes, descriptor or task.
 * @author Samchon
 */
export type AutoMovieRepaintRecordKind = "candidate" | "rendition";
