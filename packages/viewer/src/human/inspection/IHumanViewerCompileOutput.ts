/**
 * What the compile process writes: the transformed files and graph, or the error.
 *
 * @evidence contracts/common.md#principled-implementation Carries compile-human.ts JSON success files/watch/normalized inputs or its captured compiler error for runHumanViewerCompile.
 * @evidence contracts/common.md#clear-and-simple-design Optional success fields and error let the native child publish one result file even after a compiler refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exit zero can accompany an error payload; the parent rejects missing files rather than treating successful output publication as a successful compile.
 * @evidence contracts/common.md#meaningful-documentation Documents absolute forward-slash file/watch paths and platform-aware comparison inputs; optional fields are not a discriminated runtime schema.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no parse; child JSON encoding and parent read/parse scale with total transformed source bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Each run uses its own UUID output; generation-level sharing remains with createHumanViewerCompilation rather than equal result shape.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output buffers/file maps live through decoding and generation ownership; the process owner removes both final and temporary publication files.
 *
 * @author Samchon
 */
export interface IHumanViewerCompileOutput {
  /** Transformed TypeScript by absolute, forward-slash path, on success. */
  files?: Record<string, string>;

  /**
   * Reported absolute watch paths on success; without compiler graph metadata, these need not cover every dependency.
   */
  watch?: string[];

  /**
   * `watch` normalized for comparison: forward slashes, lower case on Windows and preserved case on POSIX, on success.
   */
  inputs?: string[];

  /** The compiler's failure, when no files were produced. */
  error?: string;
}
