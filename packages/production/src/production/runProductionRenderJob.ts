import { type IAutoMovieProductionRenderChunk, type IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import type { IAutoMovieProductionRenderChunkReceipt } from "./IAutoMovieProductionRenderChunkReceipt";
import { verifyProductionRenderChunkReceipt } from "./verifyProductionRenderChunkReceipt";
import type { IProductionRenderChunkFailure } from "./IProductionRenderChunkFailure";
import { productionRenderChunkLifecycleFailure } from "./productionRenderChunkLifecycleFailure";

/**
 * Schedule selected chunks through supplied currentness, lock, render and cleanup adapters.
 *
 * @evidence contracts/common.md#principled-implementation A shared synchronous cursor reserves chunks across up to min(workers,max(1,Q)) async workers; current receipt checks precede lock acquisition, and acquired attempts always reach release before workers settle. Adapters own truthful host byte/lock behavior.
 * @evidence contracts/common.md#clear-and-simple-design This scheduler coordinates adapters without providing an encoder, feature assembly or host; a live application caller remains absent and unresolved.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Busy chunks are skipped, successful failure recording returns a failed row, and record/release errors reserve the first fatal lifecycle. Other in-flight workers finish; no cancellation of their host work or aggregation of every worker's failure is promised.
 * @evidence contracts/common.md#meaningful-documentation Defines worker/deliverable refusal, borrowed plan/adapters, plan-ordered result arrays and first-fatal semantics, without claiming final feature publication.
 * @evidence contracts/performance.md#efficient-algorithms Visits Q selected chunks plus host current/render/receipt work, then sorts each result set by a Q-slot index; worker count bounds concurrent attempts but total frame/media bytes are adapter-owned and unbounded here.
 * @evidence contracts/performance.md#reuse-equivalent-work Current receipts can bypass rendering only after supplied receipt-fact checks; each acquired effectful attempt is independent and no process-wide completed result cache is installed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Awaiting all workers retains the plan/queue/results until settlement and release is attempted in acquired-attempt finally blocks. A failed host release is propagated, not certified as successful cleanup; tasks receive no internal timeout.
 */
export async function runProductionRenderJob(props: {
    /** Borrowed admitted plan; this scheduler does not validate the whole plan. */
    plan: IAutoMovieProductionRenderJobPlan;

    /** Positive safe integer maximum of concurrently scheduled worker loops. */
    workers: number;

    /** Optional exact deliverable id; an unknown id refuses before scheduling. */
    deliverable?: string;

    /** Host effects invoked in current/acquire/render-or-fail/release order. */
    adapters: {
        /** Return a current receipt or null; the returned receipt is shape-checked. */
        current(chunk: IAutoMovieProductionRenderChunk): Promise<IAutoMovieProductionRenderChunkReceipt | null>;

        /** Acquire this attempt's exclusion lease; false skips it as busy. */
        acquire(chunk: IAutoMovieProductionRenderChunk): Promise<boolean>;

        /** Encode/publish this chunk and return its completion facts. */
        render(chunk: IAutoMovieProductionRenderChunk): Promise<IAutoMovieProductionRenderChunkReceipt>;

        /** Persist a correction after render/receipt refusal; failure is fatal. */
        fail(chunk: IAutoMovieProductionRenderChunk, correction: string): Promise<void>;

        /** Release an acquired attempt even after failure; rejection is fatal. */
        release(chunk: IAutoMovieProductionRenderChunk): Promise<void>;
    };
}): Promise<{
    /** Already-current slots, ordered as the selected plan queue. */
    complete: string[];

    /** Newly rendered slots, ordered as the selected plan queue. */
    rendered: string[];

    /** Lease-unavailable slots, ordered as the selected plan queue. */
    busy: string[];

    /** Recorded render refusals; fatal record/release failures reject instead. */
    failed: Array<{
        /** Operational slot whose rendering failed. */
        slot: string;

        /** Error message or stringified arbitrary thrown value sent to the host. */
        correction: string;
    }>;
}> {
    if (Number.isSafeInteger(props.workers) === false || props.workers <= 0)
        throw new Error(`workers must be a positive safe integer, but was ${props.workers}.`);
    const queue: IAutoMovieProductionRenderChunk[] = props.plan.chunks.filter((chunk: IAutoMovieProductionRenderChunk): boolean => props.deliverable === undefined ||
        chunk.deliverable === props.deliverable);
    if (props.deliverable !== undefined &&
        props.plan.chunks.some((chunk: IAutoMovieProductionRenderChunk): boolean => chunk.deliverable === props.deliverable) === false)
        throw new Error(`Render plan has no video chunks for deliverable "${props.deliverable}".`);
    const output: {
        complete: string[];
        rendered: string[];
        busy: string[];
        failed: Array<{
            slot: string;
            correction: string;
        }>;
    } = {
        complete: [] as string[],
        rendered: [] as string[],
        busy: [] as string[],
        failed: [] as Array<{
            slot: string;
            correction: string;
        }>,
    };
    let cursor: number = 0;
    const fatalFailures: IProductionRenderChunkFailure[] = [];
    const reserveFatalFailure: () => IProductionRenderChunkFailure | undefined = (): IProductionRenderChunkFailure | undefined => {
        if (fatalFailures.length !== 0)
            return undefined;
        const failure: IProductionRenderChunkFailure = { error: undefined };
        fatalFailures.push(failure);
        return failure;
    };
    const recordFatalFailure: (error: unknown) => void = (error: unknown): void => {
        const failure: IProductionRenderChunkFailure | undefined = reserveFatalFailure();
        if (failure !== undefined)
            failure.error = error;
    };
    const worker: () => Promise<void> = async (): Promise<void> => {
        try {
            while (fatalFailures.length === 0 && cursor < queue.length) {
                const chunk: IAutoMovieProductionRenderChunk = queue[cursor++]!;
                const current: IAutoMovieProductionRenderChunkReceipt | null = await props.adapters.current(chunk);
                if (current !== null) {
                    verifyProductionRenderChunkReceipt({
                        plan: props.plan,
                        chunk,
                        receipt: current,
                    });
                    output.complete.push(chunk.slot);
                    continue;
                }
                if ((await props.adapters.acquire(chunk)) === false) {
                    output.busy.push(chunk.slot);
                    continue;
                }
                let attemptFailure: IProductionRenderChunkFailure | undefined;
                let failureRecordFailure: IProductionRenderChunkFailure | undefined;
                let releaseFailure: IProductionRenderChunkFailure | undefined;
                let fatalFailure: IProductionRenderChunkFailure | undefined;
                try {
                    const receipt: IAutoMovieProductionRenderChunkReceipt = await props.adapters.render(chunk);
                    verifyProductionRenderChunkReceipt({
                        plan: props.plan,
                        chunk,
                        receipt,
                    });
                    output.rendered.push(chunk.slot);
                }
                catch (error) {
                    attemptFailure = { error };
                    const correction: string = error instanceof Error ? error.message : String(error);
                    try {
                        await props.adapters.fail(chunk, correction);
                        output.failed.push({ slot: chunk.slot, correction });
                    }
                    catch (failure) {
                        failureRecordFailure = { error: failure };
                        fatalFailure = reserveFatalFailure();
                    }
                }
                finally {
                    try {
                        await props.adapters.release(chunk);
                    }
                    catch (failure) {
                        releaseFailure = { error: failure };
                        fatalFailure ??= reserveFatalFailure();
                    }
                    if (fatalFailure !== undefined)
                        fatalFailure.error = productionRenderChunkLifecycleFailure(attemptFailure, failureRecordFailure, releaseFailure);
                }
            }
        }
        catch (error) {
            recordFatalFailure(error);
        }
    };
    await Promise.all(Array.from({ length: Math.min(props.workers, Math.max(1, queue.length)) }, worker));
    if (fatalFailures.length !== 0)
        throw fatalFailures[0]!.error;
    const order: Map<string, number> = new Map(queue.map((chunk: IAutoMovieProductionRenderChunk, index: number): [
        string,
        number
    ] => [chunk.slot, index]));
    output.complete.sort((left: string, right: string): number => order.get(left)! - order.get(right)!);
    output.rendered.sort((left: string, right: string): number => order.get(left)! - order.get(right)!);
    output.busy.sort((left: string, right: string): number => order.get(left)! - order.get(right)!);
    output.failed.sort((left: {
        slot: string;
        correction: string;
    }, right: {
        slot: string;
        correction: string;
    }): number => order.get(left.slot)! - order.get(right.slot)!);
    return output;
}
