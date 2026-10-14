import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import type { IAutoMovieRepaintRuntimeIdentity } from "@automovie/interface";
import typia, { type IValidation } from "typia";
import { canonicalAutoMovieRepaintRuntimeIdentity } from "./renditionIdentity";
import type { IAutoMovieRepaintAttemptRecord } from "./repaintExecution";
import { productionRepaintRawOutputReceiptPath } from "./repaintRawOutput";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRepaintRetryableFailureClasses } from "./productionProjectRepaintRetryableFailureClasses";
import { productionProjectUuid } from "./productionProjectUuid";

/**
 * Admit one immutable terminal repaint attempt for the selected production.
 *
 * @evidence contracts/common.md#principled-implementation Exact schema validation precedes canonical runtime identity, UUID/digest, ordinal/seed, ISO timestamp, cost, status/failure and output-fact checks; malformed or inconsistent records refuse before persistence or receipt reuse.
 * @evidence contracts/common.md#clear-and-simple-design This validator owns terminal-record coherence; execution policy and current receipt dependencies stay with their distinct ledger/receipt operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The retryable failure-class set is the supported retry boundary; invalid adapter JSON/canonical identity becomes refusal rather than a replacement identity, and no expected attempt bypasses validation.
 * @evidence contracts/common.md#meaningful-documentation States selected-production and terminal-record scope; successful return validates metadata, not resident output bytes or execution-policy compliance, and schema/UUID/coherence refusals propagate.
 * @evidence contracts/performance.md#efficient-algorithms Schema traversal and adapter JSON parse/canonicalization scale with record/identity text; the remaining fixed field checks and supported retry-class lookup use bounded work independent of the full attempt population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every supplied record is revalidated; an earlier attempt ID or schema result cannot establish equal canonical metadata for a later object.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed runtime data, schema results and two Date objects are call-local; the borrowed attempt is unchanged and no file, cache or running provider task is acquired.
 */
export function productionProjectAssertRepaintAttempt(state: AutoMovieProductionProjectState, attempt: IAutoMovieRepaintAttemptRecord): void {
    const schema: IValidation<IAutoMovieRepaintAttemptRecord> = typia.validateEquals<IAutoMovieRepaintAttemptRecord>(attempt);
    if (schema.success === false)
        throw new Error("Repaint attempt record is malformed.");
    let adapterIdentityValid: boolean = false;
    try {
        const runtime: IValidation<IAutoMovieRepaintRuntimeIdentity> = typia.validateEquals<IAutoMovieRepaintRuntimeIdentity>(JSON.parse(attempt.adapterIdentity));
        adapterIdentityValid =
            runtime.success &&
                canonicalAutoMovieRepaintRuntimeIdentity(runtime.data) ===
                    attempt.adapterIdentity;
    }
    catch { }
    const startedAt: Date = new Date(attempt.startedAt);
    const completedAt: Date = new Date(attempt.completedAt);
    if (attempt.version !== 1 ||
        attempt.productionId !== state.productionId ||
        attempt.shot.trim().length === 0 ||
        attempt.shot !== attempt.shot.trim() ||
        productionProjectUuid(attempt.requestId, "Repaint request id") !== attempt.requestId ||
        productionProjectUuid(attempt.attemptId, "Repaint attempt id") !== attempt.attemptId ||
        Number.isSafeInteger(attempt.ordinal) === false ||
        attempt.ordinal <= 0 ||
        SHA256_DIGEST_PATTERN.test(attempt.requestFingerprint) === false ||
        SHA256_DIGEST_PATTERN.test(attempt.compileFingerprint) === false ||
        SHA256_DIGEST_PATTERN.test(attempt.sourceRenderFingerprint) ===
            false ||
        adapterIdentityValid === false ||
        Number.isSafeInteger(attempt.seed) === false ||
        Number.isNaN(startedAt.getTime()) ||
        Number.isNaN(completedAt.getTime()) ||
        startedAt.toISOString() !== attempt.startedAt ||
        completedAt.toISOString() !== attempt.completedAt ||
        completedAt.getTime() < startedAt.getTime() ||
        Number.isFinite(attempt.costUnits) === false ||
        attempt.costUnits < 0 ||
        (attempt.status === "succeeded") !== (attempt.failure === null) ||
        (attempt.status === "succeeded" && attempt.availableOutput === null) ||
        (attempt.failure !== null &&
            (attempt.failure.message.trim().length === 0 ||
                attempt.failure.message !== attempt.failure.message.trim() ||
                attempt.status !==
                    (attempt.failure.class === "cancelled"
                        ? "cancelled"
                        : attempt.failure.class === "invalid-output"
                            ? "invalid"
                            : attempt.failure.class === "input-stale"
                                ? "stale"
                                : "failed") ||
                (attempt.failure.retryable &&
                    (attempt.status !== "failed" ||
                        productionProjectRepaintRetryableFailureClasses.has(attempt.failure.class) ===
                            false)))) ||
        (attempt.availableOutput !== null &&
            (Number.isSafeInteger(attempt.availableOutput.bytes) === false ||
                attempt.availableOutput.bytes <= 0 ||
                SHA256_DIGEST_PATTERN.test(attempt.availableOutput.digest) ===
                    false ||
                (attempt.availableOutput.receipt !== undefined &&
                    attempt.availableOutput.receipt !==
                        productionRepaintRawOutputReceiptPath(attempt.requestId, attempt.attemptId)))))
        throw new Error("Repaint attempt record is malformed.");
}
