import type { IAutoMovieLibrarySourceExecution } from "./IAutoMovieLibrarySourceExecution";
import type { IAutoMovieLibraryAuthoringSourceSnapshot } from "./IAutoMovieLibraryAuthoringSourceSnapshot";

/**
 * Executable source plan and every refusal found before Node evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Sorted admitted exports, the full selected source population and refusals describe one pre-evaluation plan.
 * @evidence contracts/common.md#clear-and-simple-design The producer empties entries on any refusal and shares snapshot sources with compile consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type cannot enforce all-or-empty correlation or freeze shared sources; callers rely on its producer.
 * @evidence contracts/common.md#meaningful-documentation Documents entry refusal meaning and shared source-list lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased plan selects no runtime algorithm; createAutoMovieLibrarySourceExecutionPlan owns source indexing, edge checks and sorting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no shared request; the planner reuses its supplied snapshot and creates a new plan for that attempt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no entry or task; callers retain plan entries/problems and the shared snapshot source-list reference.
 * @author Samchon
 */
export interface IAutoMovieLibrarySourceExecutionPlan {

    /**
     * Canonically ordered exports admitted to this attempt; admission does not prove execution safety or success.
     */
    entries: readonly IAutoMovieLibrarySourceExecution[];

    /**
     * Complete selected source identity, including missing members.
     */
    sources: readonly IAutoMovieLibraryAuthoringSourceSnapshot[];

    /**
     * Refusals that empty the executable entry set.
     */
    problems: readonly string[];
}
