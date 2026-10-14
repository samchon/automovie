import type { AutoMovieRepaintFailureClass, IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";
import type { IAutoMovieRepaintAttemptRecord } from "./repaintExecution";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";

/**
 * Check an already admitted ordered attempt ledger against its immutable execution policy.
 *
 * @evidence contracts/common.md#principled-implementation The receipt reader supplies individually validated attempts and an admitted policy; this pass checks attempt count, cumulative cost, retryability classification and backoff, then requires a succeeded final attempt within strict timeout/elapsed limits.
 * @evidence contracts/common.md#clear-and-simple-design Ledger aggregation is separate from individual record validation and current-output verification; the state argument is deliberately unused because these supplied records determine the policy verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality reaches the timeout/elapsed refusal boundary and exhausted cost prevents another attempt; this validator neither retries a provider nor rewrites stored failure classes or dates.
 * @evidence contracts/common.md#meaningful-documentation States the admitted ordered-input premise and policy checks; record schema, ordinal lineage and current output identity remain with the supplying attempt/receipt readers.
 * @evidence contracts/performance.md#efficient-algorithms With A attempts and R retry classes, the pass uses O(A times R) membership comparisons and linear timestamp/cost aggregation; each backoff slice has at most one item and no complete ledger copy is made here.
 * @evidence contracts/performance.md#reuse-equivalent-work The running spent total and previous attempt are reused within the pass; prior policy success is not cached across potentially changed ledger inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain borrowed; counters, Date conversions and bounded backoff slices are temporary, with no retained ledger, provider handle or timer on return/refusal.
 */
export function productionProjectAssertRepaintAttemptLedgerPolicy(_state: AutoMovieProductionProjectState, first: IAutoMovieRepaintAttemptRecord, remaining: readonly IAutoMovieRepaintAttemptRecord[], policy: IAutoMovieRepaintExecutionPolicy): void {
    const firstStartedAt: number = new Date(first.startedAt).getTime();
    const firstPolicyMarkedRetryable: boolean = policy.retryableFailures.some((failureClass: AutoMovieRepaintFailureClass): boolean => failureClass === first.failure?.class);
    let spent: number = first.costUnits;
    let previous: IAutoMovieRepaintAttemptRecord = first;
    if (remaining.length + 1 > policy.maximumAttempts ||
        spent > policy.maximumCostUnits ||
        (first.failure !== null &&
            first.failure.retryable !==
                (first.status === "failed" && firstPolicyMarkedRetryable)))
        throw new Error("Stored repaint attempt ledger exceeds its immutable execution policy.");
    for (const [index, attempt] of remaining.entries()) {
        const policyMarkedRetryable: boolean = policy.retryableFailures.some((failureClass: AutoMovieRepaintFailureClass): boolean => failureClass === attempt.failure?.class);
        const backoff: number = Math.min(...policy.backoffMs.slice(index, index + 1));
        if (spent >= policy.maximumCostUnits ||
            new Date(attempt.startedAt).getTime() <
                new Date(previous.completedAt).getTime() + backoff)
            throw new Error("Stored repaint attempt ledger exceeds its immutable execution policy.");
        spent += attempt.costUnits;
        if (spent > policy.maximumCostUnits ||
            (attempt.failure !== null &&
                attempt.failure.retryable !==
                    (attempt.status === "failed" && policyMarkedRetryable)))
            throw new Error("Stored repaint attempt ledger exceeds its immutable execution policy.");
        previous = attempt;
    }
    if (previous.status !== "succeeded" ||
        new Date(previous.completedAt).getTime() -
            new Date(previous.startedAt).getTime() >=
            policy.attemptTimeoutMs ||
        new Date(previous.completedAt).getTime() - firstStartedAt >=
            policy.maximumElapsedMs)
        throw new Error("Stored repaint attempt ledger exceeds its immutable execution policy.");
}
