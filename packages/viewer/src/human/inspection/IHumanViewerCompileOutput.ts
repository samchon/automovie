/**
 * What the compile process writes: the transformed files and graph, or the error.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the success and failure members.
 *
 * @evidence contracts/common.md#principled-implementation Success carries transformed source and watched input paths; an error represents failure without claiming produced files.
 * @evidence contracts/common.md#clear-and-simple-design Optional result fields describe the existing compiler process output without a second build graph schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A compile error is preserved as its own outcome instead of substituting stale transformed text.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Success carries transformed source and watched input paths; an error represents failure without claiming produced files.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest A compile error is preserved as its own outcome instead of substituting stale transformed text.
 *
 * @author Samchon
 */
export interface IHumanViewerCompileOutput {
  /**
   * Transformed TypeScript by absolute, forward-slash path, on success.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Carries actually transformed source text only when the compiler produced a successful output.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Carries actually transformed source text only when the compiler produced a successful output.
   */
  files?: Record<string, string>;

  /**
   * Every file the compile depends on, as absolute paths to watch, on success.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Enumerates absolute actual compiler dependencies that subsequent source observation must watch.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Enumerates absolute actual compiler dependencies that subsequent source observation must watch.
   */
  watch?: string[];

  /**
   * `watch` normalized for comparison (forward slashes, lower case), on success.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Keeps a normalized comparison view of the same watched inputs without replacing original source lookup paths.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Keeps a normalized comparison view of the same watched inputs without replacing original source lookup paths.
   */
  inputs?: string[];

  /**
   * The compiler's failure, when no files were produced.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves the original compile failure instead of returning stale transformed modules as new success.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves the original compile failure instead of returning stale transformed modules as new success.
   */
  error?: string;
}
