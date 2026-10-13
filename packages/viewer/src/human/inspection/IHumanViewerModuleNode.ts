/**
 * The part of a Vite module graph node the generation invalidator reads.
 *
 * @evidence contracts/common.md#principled-implementation Projects Vite's resolved module id, including query variants, for source-event invalidation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the structural module graph boundary independent of Vite's full runtime implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null/fileless ids are skipped and query stripping is lexical; this projection is not realpath or complete filesystem identity proof.
 * @evidence contracts/common.md#meaningful-documentation Documents query-bearing resolved id and null absence rather than claiming every graph node has a source file.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no invalidation; the consumer scans graph entries/ids and invalidates matching source variants.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing graph nodes are invalidated under the source event's canonical path; a prior module object cannot authorize unchanged byte assumptions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The Vite server owns module graph/node lifetime; this borrowed id projection acquires no watcher or compiled generation.
 *
 * @author Samchon
 */
export interface IHumanViewerModuleNode {
  /** Resolved module id with any query, or null for a module without a file. */
  id: string | null;
}
