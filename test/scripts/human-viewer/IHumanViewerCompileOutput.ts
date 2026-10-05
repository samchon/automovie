import type { IHumanViewerCompileGraph } from "./IHumanViewerCompileGraph";

/**
 * What the compile process writes: the transformed files and graph, or the error.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the success and failure members.
 * @author Samchon
 */
export interface IHumanViewerCompileOutput {
  /** Transformed TypeScript by package-relative path, on success. */
  files?: Record<string, string>;

  /** Import graph and compiler inputs to watch, on success. */
  graph?: IHumanViewerCompileGraph;

  /** The compiler's failure, when no files were produced. */
  error?: string;
}
