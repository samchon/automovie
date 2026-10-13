

/**
 * One exact graph-selected source export admitted to library execution.
 *
 * @evidence contracts/common.md#principled-implementation An exact branch/module/export and target owner address pair with the normalized source digest admitted by the execution plan.
 * @evidence contracts/common.md#clear-and-simple-design Library owner-context and source-registration linking consume this edge before evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record does not execute the export, prove code safety or keep mutable source bytes unchanged.
 * @evidence contracts/common.md#meaningful-documentation Documents source export identity and design-owner address rather than successful execution.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased export edge evaluates no module; createAutoMovieLibrarySourceExecutionPlan owns digest/completion admission and entry ordering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The edge coordinates no execution reuse; the planner borrows current snapshot digests, while compilation separately evaluates source by scope.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no source bytes; plan callers hold entry strings/digests until the attempt ends, and the planner opens no handle.
 * @author Samchon
 */
export interface IAutoMovieLibrarySourceExecution {

    /**
     * Graph source branch that selected the export.
     */
    branch: string;

    /**
     * Canonical project-relative POSIX source module path.
     */
    sourcePath: string;

    /**
     * Named top-level export to evaluate.
     */
    exportName: string;

    /**
     * Exact authored target path and anchor.
     */
    owner: string;

    /**
     * Normalized source digest authenticated by the execution plan.
     */
    sourceDigest: string;
}
