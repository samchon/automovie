import type { IHumanViewerCompileGraph } from "./IHumanViewerCompileGraph";

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

  /** Import graph and compiler inputs, when the compiler reported one. */
  graph: IHumanViewerCompileGraph | undefined;
}
