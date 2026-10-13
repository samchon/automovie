/**
 * A completed human-package compile: transformed files by absolute path and
 * the graph of inputs to watch.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the files and the graph.
 *
 * @evidence contracts/common.md#principled-implementation Completed transformed files and both original and normalized watch paths describe one successful compile result.
 * @evidence contracts/common.md#clear-and-simple-design The normalized paths serve comparison while original paths retain actual source lookup meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only completed compiler output enters this shape; filename normalization supplies no fabricated source bytes.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledPackage {
  /** Transformed TypeScript by absolute, forward-slash path. */
  files: Record<string, string>;

  /** Every file the compile depends on, as absolute paths to watch. */
  watch: string[];

  /** `watch` normalized for comparison (forward slashes, lower case). */
  inputs: string[];
}
