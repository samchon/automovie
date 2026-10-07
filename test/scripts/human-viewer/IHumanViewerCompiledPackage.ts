/**
 * A completed human-package compile: transformed files by absolute path and
 * the graph of inputs to watch.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the files and the graph.
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
