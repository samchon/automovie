


/**
 * One graph-selected source export and the exact authored unit it realizes.
 *
 * @evidence contracts/common.md#principled-implementation Graph-selected source export and exact authored target form one lineage edge with the normalized source byte digest inspected for that export.
 * @evidence contracts/common.md#clear-and-simple-design One edge records accountable source and target identities without executing a module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source byte identity does not become an automatic semantic quality judgment or a generated text-review fingerprint.
 * @evidence contracts/common.md#meaningful-documentation Members state graph activation, symbol kind, normalized source digest and exact target address.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased export-to-target edge acquires nothing; sourceOwnerBindingsOf constructs string/digest records for the observation caller and keeps parsed ASTs and source text within its inspection call.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidenceSourceOwnerBinding {

  /** Source branch that selected this edge. */
  branch: string;

  /** Current lifecycle stage of that source branch. */
  stage: string;

  /** Whether the graph currently enforces this relationship. */
  enforced: boolean;

  /** Exact graph relationship carried into runtime admission. */
  relationship: "lineage";

  /** Canonical project-relative POSIX source path. */
  sourcePath: string;

  /** Named top-level export that carries the citation. */
  exportName: string;

  /** Evidence symbol kind of that export. */
  symbolKind: "function" | "property" | "type";

  /** SHA-256 of the normalized source bytes inspected for this edge. */
  sourceDigest: string;

  /** Canonical project-relative POSIX authored target path. */
  targetPath: string;

  /** Exact explicit target anchor without `#`. */
  targetAnchor: string;

}
