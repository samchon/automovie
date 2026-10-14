


/**
 * The source population that realizes one active design branch.
 *
 * @evidence contracts/common.md#principled-implementation Manifest branch, stage, enforcement and exact host selectors define active source lineage.
 * @evidence contracts/common.md#clear-and-simple-design Selected path inventory stays beside selectors without a second design-source matrix.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Enforcement metadata is graph activation, not a claim that source execution or semantic review has succeeded.
 * @evidence contracts/common.md#meaningful-documentation Members state exact globs, symbols and existing selected project-relative paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased lineage interface creates no source population. The supplying observation owns its selectors and paths; librarySnapshotActivePaths shares active supplied paths during acquisition and librarySnapshotCanonicalSourceBinding copies selected records into the attempt-owned authoring snapshot.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidenceSourceBinding {

  /** Source branch identity derived from the binding manifest. */
  branch: string;

  /** Current lifecycle stage of that source branch. */
  stage: string;

  /** Whether the graph currently enforces this lineage relationship. */
  enforced: boolean;

  /** Evidence root of the source population. */
  root: string;

  /** Exact manifest globs selecting the source population. */
  files: readonly string[];

  /** Exact manifest symbol kinds selected from those files. */
  symbols: readonly string[];

  /** Existing project-relative source files selected by the manifest globs. */
  paths: readonly string[];
}
