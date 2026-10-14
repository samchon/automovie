import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRevision } from "./productionProjectRevision";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Confirm the observed revision and caller input predicate through the existing read-only or writable authority path.
 *
 * @evidence contracts/common.md#principled-implementation Read-only confirmation checks expected versus last-observed revision, the input predicate and a fresh revision in that short-circuit order; writable confirmation runs the existing locked transaction with an empty stage and empty-revision publication disabled.
 * @evidence contracts/common.md#clear-and-simple-design This operation exposes snapshot confirmation without another lock or snapshot representation; the caller defines complete input equivalence and the transaction/revision owners supply current generation observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A false predicate or moved revision refuses rather than retrying or updating inputs; the writable empty transaction is not represented as an output publication or new revision.
 * @evidence contracts/common.md#meaningful-documentation Defines the default last-read revision, branch-specific checks and returned revision; a caller predicate's coverage limits remain its responsibility and read-only endpoint observation does not prevent a later filesystem change.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes caller-defined input-current work plus a guarded revision read for the read-only branch or complete namespace/revision/lock and pre/post predicate work for the writable empty transaction; empty staging does not make confirmation filesystem-free.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied expected revision remains the comparison basis across the operation; input facts and resident revision are reobserved, with no cached successful predicate replacing required checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate and state are borrowed synchronously; writable lock/lease cleanup belongs to commitFiles and read-only reader cleanup to revision owners, with no staged payload, timer or retained confirmation task.
 */
export function productionProjectConfirmCurrentSnapshot(state: AutoMovieProductionProjectState, inputCurrent: () => boolean, expectedRevision: number = state.lastReadRevision_): number {
    if (state.readOnly_) {
        if (expectedRevision !== state.lastReadRevision_ ||
            inputCurrent() === false ||
            productionProjectRevision(state) !== expectedRevision)
            throw new AutoMovieProductionInputRaceError("Production inputs changed during read-only snapshot confirmation.");
        return expectedRevision;
    }
    return productionProjectCommitFiles(state, (): never[] => [], inputCurrent, expectedRevision, undefined, false);
}
