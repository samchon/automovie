/**
 * What the compile process writes: the transformed files and graph, or the error.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the success and failure members.
 *
 * @evidence contracts/common.md#principled-implementation Success carries transformed source and watched input paths; an error represents failure without claiming produced files.
 * @evidence contracts/common.md#clear-and-simple-design Optional result fields describe the existing compiler process output without a second build graph schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A compile error is preserved as its own outcome instead of substituting stale transformed text.
 *
 * @author Samchon
 */
export interface IHumanViewerCompileOutput {
  /** Transformed TypeScript by absolute, forward-slash path, on success. */
  files?: Record<string, string>;

  /**
   * Every file the compile depends on, as absolute paths to watch, on success.
   */
  watch?: string[];

  /**
   * `watch` normalized for comparison (forward slashes, lower case), on success.
   */
  inputs?: string[];

  /** The compiler's failure, when no files were produced. */
  error?: string;
}
