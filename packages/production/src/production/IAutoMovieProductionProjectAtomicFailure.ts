/**
 * Preserve a primary atomic-operation failure for subsequent temporary cleanup.
 *
 * @evidence contracts/common.md#principled-implementation A present record distinguishes a thrown undefined value from no failure; cleanup preserves its original value before any cleanup error.
 * @evidence contracts/common.md#clear-and-simple-design One error field joins the atomic writer and cleanup owner without interpreting the thrown value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined error remains a failure when wrapped; truthiness never turns it into success.
 * @evidence contracts/common.md#meaningful-documentation Documents presence versus error value and the primary-before-cleanup ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This carrier performs no publication or error-classification algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A failure record does not share or retry completed filesystem effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The invoking operation owns the record and referenced thrown value; the type acquires no handle or task.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectAtomicFailure {
    /** Original thrown value, including undefined, retained without conversion. */
    error: unknown;
}
