import type { IAutoMovieRepaintRawOutputPublication } from "./repaintRawOutput";
import path from "node:path";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import type { IAutoMovieRepaintAttemptRecord } from "./repaintExecution";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectRepaintAttemptPath } from "./productionProjectRepaintAttemptPath";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectRepaintRawOutput } from "./productionProjectRepaintRawOutput";
import { productionProjectRepaintRequestAttempts } from "./productionProjectRepaintRequestAttempts";
import { productionProjectAssertRepaintAttempt } from "./productionProjectAssertRepaintAttempt";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Publish the next immutable terminal attempt while guarding its complete request prefix.
 *
 * @evidence contracts/common.md#principled-implementation Individual attempt admission and any cited resident raw-output revision precede duplicate-path and chronological-prefix checks; the transaction callback accepts only the observed prefix or that prefix plus this exact attempt.
 * @evidence contracts/common.md#clear-and-simple-design Terminal ledger publication composes record, raw-output and ordered-prefix owners; commitFiles retains namespace/revision checks and rollback, while execution determines the provider result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An existing attempt or a nonretryable predecessor refuses; immutable request fields and chronology cannot drift, and a failed input-current callback or prefix read never becomes a successful publication guard.
 * @evidence contracts/common.md#meaningful-documentation Defines next ordinal, predecessor compatibility, optional raw-output citation and pre/post prefix equivalence; resident or transaction failures propagate and this operation dispatches no provider.
 * @evidence contracts/performance.md#efficient-algorithms Includes raw-output admission when cited, complete prefix read/validation/sort and canonical serialization of prior/next ledgers; each transaction currentness callback rereads and canonicalizes the prefix, with costs scaling with ledger/output bytes and parser populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Prior and next canonical identities are reused across transaction callback invocations; current prefixes are still reobserved so equality is based on complete metadata rather than an attempt ID.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prior records and both canonical ledger strings remain live through the synchronous transaction; cited output bytes and guarded-read buffers are temporary, and commitFiles owns lock/staging cleanup without a retained execution task.
 */
export function productionProjectCommitRepaintAttempt(state: AutoMovieProductionProjectState, attempt: IAutoMovieRepaintAttemptRecord, inputCurrent?: () => boolean): number {
    productionProjectAssertRepaintAttempt(state, attempt);
    if (attempt.availableOutput?.receipt !== undefined) {
        const raw: IAutoMovieRepaintRawOutputPublication = productionProjectRepaintRawOutput(state, attempt.requestId, attempt.attemptId);
        if (raw.receipt.digest !== attempt.availableOutput.digest ||
            raw.receipt.bytes !== attempt.availableOutput.bytes)
            throw new Error(`Repaint attempt "${attempt.attemptId}" does not cite its exact resident raw output revision.`);
    }
    const relative: string = productionProjectRepaintAttemptPath(attempt.requestId, attempt.attemptId);
    if (productionProjectReadTrackedStateFile(state, relative) !== null)
        throw new Error(`Repaint attempt "${attempt.attemptId}" already exists.`);
    const priorAttempts: IAutoMovieRepaintAttemptRecord[] = productionProjectRepaintRequestAttempts(state, attempt.requestId);
    const previous: IAutoMovieRepaintAttemptRecord | undefined = priorAttempts.at(-1);
    if (attempt.ordinal !== priorAttempts.length + 1 ||
        (previous !== undefined &&
            (previous.status !== "failed" ||
                previous.failure?.retryable !== true ||
                attempt.shot !== previous.shot ||
                attempt.requestFingerprint !== previous.requestFingerprint ||
                attempt.compileFingerprint !== previous.compileFingerprint ||
                attempt.sourceRenderFingerprint !==
                    previous.sourceRenderFingerprint ||
                attempt.adapterIdentity !== previous.adapterIdentity ||
                attempt.seed !== previous.seed ||
                new Date(attempt.startedAt).getTime() <
                    new Date(previous.completedAt).getTime())))
        throw new Error(`Repaint attempt "${attempt.attemptId}" is not the next chronological terminal state of its immutable request.`);
    const priorIdentity: string = canonicalizeAutoMovieJson(priorAttempts);
    const nextIdentity: string = canonicalizeAutoMovieJson([...priorAttempts, attempt]);
    return productionProjectCommitFiles(state, [
        {
            path: path.join(state.productionStateRoot, ...relative.split("/")),
            content: productionProjectSerializeJson(attempt),
        },
    ], (): boolean => {
        if ((inputCurrent?.() ?? true) === false)
            return false;
        try {
            const current: string = canonicalizeAutoMovieJson(productionProjectRepaintRequestAttempts(state, attempt.requestId));
            return current === priorIdentity || current === nextIdentity;
        }
        catch {
            return false;
        }
    });
}
