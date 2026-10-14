import { cleanupProductionAtomic } from "./productionMutation";
import { IAutoMovieProductionProjectAtomicFailure } from "./IAutoMovieProductionProjectAtomicFailure";
import { productionProjectRemoveContendedAtomic } from "./productionProjectRemoveContendedAtomic";

/**
 * Dispose the atomic writer's temporary path while preserving causal failures.
 *
 * @evidence contracts/common.md#principled-implementation Shared cleanup invokes contended removal and aggregates primary-before-cleanup failures, including a present undefined primary value.
 * @evidence contracts/common.md#clear-and-simple-design This adapter joins the temporary-path removal effect to the existing failure-accounting owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup failure remains observable after a successful publication and cannot certify that publication was rolled back.
 * @evidence contracts/common.md#meaningful-documentation States temporary ownership, causal ordering and separate successful-publication cleanup failure.
 * @evidence contracts/performance.md#efficient-algorithms One removal request inherits native retry/wait costs; failure aggregation contains at most the primary and cleanup values.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cleanup is attempted for this operation's path, never skipped because a previous temporary was removed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful cleanup releases the temporary entry; a refused cleanup can leave it resident and returns its failures to the caller for recovery.
 */
export function productionProjectRemoveAtomicTemporary(temporary: string, failure: IAutoMovieProductionProjectAtomicFailure | undefined): void {
    return cleanupProductionAtomic(temporary, failure, (): void => productionProjectRemoveContendedAtomic(temporary));
}
