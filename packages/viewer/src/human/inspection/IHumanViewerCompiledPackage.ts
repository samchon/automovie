/**
 * A completed human-package compile: transformed files by absolute path and the graph of inputs to watch.
 *
 * @evidence contracts/common.md#principled-implementation Names the successful transformed Human source map and its canonical watched/input path population returned by the compile process owner.
 * @evidence contracts/common.md#clear-and-simple-design Keeps code publication and dependency invalidation facts together instead of separating maps from their input authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The parent requires files but defaults absent watch/inputs to empty for older output; this type alone does not validate their completeness.
 * @evidence contracts/common.md#meaningful-documentation Defines absolute forward-slash keys and normalized comparison paths, lowercased on Windows while preserving case on POSIX.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; encoding/read/parse and watch construction scale with transformed byte and compiler-input populations.
 * @evidence contracts/performance.md#reuse-equivalent-work The compilation owner shares one generation promise/map until invalidation and marks stale last-good fallback explicitly after refusal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One current and last-good map are held by their owner, while outstanding lookups can retain older generations; this record owns no child process.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledPackage {
  /** Transformed TypeScript by absolute, forward-slash path. */
  files: Record<string, string>;

  /** Reported absolute watch paths; exhaustive dependency coverage requires compiler graph metadata. */
  watch: string[];

  /** `watch` normalized for comparison: forward slashes, lower case on Windows and preserved case on POSIX. */
  inputs: string[];
}
