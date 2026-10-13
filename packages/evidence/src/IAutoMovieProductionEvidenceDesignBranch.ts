import type { IAutoMovieProductionEvidenceSourceBinding } from "./IAutoMovieProductionEvidenceSourceBinding";


/**
 * One active design branch, retained even when its owner population is empty.
 *
 * @evidence contracts/common.md#principled-implementation Branch identity and lifecycle persist even with no owner files, with optional manifest-derived source lineage.
 * @evidence contracts/common.md#clear-and-simple-design An explicit branch DTO prevents empty owner populations from disappearing from observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty population and unstarted source branch remain exact states rather than fabricated hosts.
 * @evidence contracts/common.md#meaningful-documentation Members state design stage and null-before-start source binding.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased branch declaration allocates no inventory; readAutoMovieProductionEvidence creates stage/lineage records, including empty branches, and transfers them to the observation caller.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidenceDesignBranch {

  /** Authored design branch identity derived from the binding manifest. */
  branch: string;

  /** Current lifecycle stage of the authored design branch. */
  designStage: string;

  /** Active source lineage, or null before that source branch starts. */
  sourceBinding: IAutoMovieProductionEvidenceSourceBinding | null;
}
