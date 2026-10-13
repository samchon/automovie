import type { IAutoMovieProductionEvidenceUnit } from "./IAutoMovieProductionEvidenceUnit";
import type { IAutoMovieProductionEvidenceSourceBinding } from "./IAutoMovieProductionEvidenceSourceBinding";


/**
 * One exact production-owned design document selected by the live graph.
 *
 * @evidence contracts/common.md#principled-implementation One governed design document carries ordered H2 identity and optional active source binding.
 * @evidence contracts/common.md#clear-and-simple-design Owner identity is distinct from branch activation and source-export edges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null sourceBinding represents an unstarted source branch rather than an invented empty implementation.
 * @evidence contracts/common.md#meaningful-documentation Members state graph-selected path, sole H1 and ordered denominator.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased owner shape performs no read or retention; readAutoMovieProductionEvidence shares each parsed document's H2 units and its branch source binding into owner records whose lifetime belongs to the result caller.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidenceDesignOwner {

  /** Authored design branch identity derived from the binding manifest. */
  branch: string;

  /** Project-relative POSIX path of the design owner. */
  path: string;

  /** The document's sole H1 title. */
  title: string;

  /** Exact H2 denominator in document order. */
  units: readonly IAutoMovieProductionEvidenceUnit[];

  /** Active source lineage for this owner, or null before that branch starts. */
  sourceBinding: IAutoMovieProductionEvidenceSourceBinding | null;
}
