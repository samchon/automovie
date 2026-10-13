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
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Completed transformed files and both original and normalized watch paths describe one successful compile result.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Only completed compiler output enters this shape; filename normalization supplies no fabricated source bytes.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledPackage {
  /**
   * Transformed TypeScript by absolute, forward-slash path.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Pairs absolute module paths with their actual transformed source from one completed compile.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Pairs absolute module paths with their actual transformed source from one completed compile.
   */
  files: Record<string, string>;

  /**
   * Every file the compile depends on, as absolute paths to watch.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Retains the complete successful compile's dependency paths for input invalidation.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Retains the complete successful compile's dependency paths for input invalidation.
   */
  watch: string[];

  /**
   * `watch` normalized for comparison (forward slashes, lower case).
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Provides stable slash/case comparison of the same dependency membership used by source freshness.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Provides stable slash/case comparison of the same dependency membership used by source freshness.
   */
  inputs: string[];
}
