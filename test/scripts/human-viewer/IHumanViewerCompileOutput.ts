/**
 * What the compile process writes: the transformed files and graph, or the error.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the success and failure members.
 * @author Samchon
 */
export interface IHumanViewerCompileOutput {
  /** Transformed TypeScript by absolute, forward-slash path, on success. */
  files?: Record<string, string>;

  /** Every file the compile depends on, as absolute paths to watch, on success. */
  watch?: string[];

  /** `watch` normalized for comparison (forward slashes, lower case), on success. */
  inputs?: string[];

  /** The compiler's failure, when no files were produced. */
  error?: string;
}
