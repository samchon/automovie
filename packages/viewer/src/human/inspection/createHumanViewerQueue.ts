import type { HumanViewerLane } from "./HumanViewerLane.js";
import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError.js";
import type { ICreateHumanViewerQueueProps } from "./ICreateHumanViewerQueueProps.js";
import type { IHumanViewerQueueRunning } from "./IHumanViewerQueueRunning.js";
import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus.js";

const LANES: readonly HumanViewerLane[] = ["ui", "cli", "bulk"];

/**
 * The one GPU page every request shares, served in three lanes: `ui` for a person waiting on the screen, `cli` for scripted captures and `bulk` for thumbnails and pre-building. Requests within a lane run in arrival order; UI has priority except that after `patience` consecutive UI starts a waiting CLI request goes next. A request that finds `limit` others already waiting in its lane is refused immediately. Bulk starts only when no UI or CLI request is waiting and `quietMs` has elapsed since the latest admitted foreground arrival or foreground completion. The quiet interval defers background work after observed activity; a later foreground arrival still waits for any bulk task already running. The status names the running request and each lane's length so a stalled server can be told from a busy one. A cancelled waiting entry is removed before its callback starts. Cancelling a running requester rejects its result but retains the GPU slot until the actual task settles; rejecting a promise does not stop work on the page.
 *
 * Capacity bounds cover waiting requests per lane and one actual unsettled task callback. Settlement is observed through its promise, without independent OS/GPU retirement proof; the task's owner must retain native lifetime responsibility. This scheduler supplies neither a production claim wait graph nor storage or network credit policy.
 *
 * @evidence contracts/common.md#principled-implementation Bounded FIFO lanes select UI/CLI work by patience and gate bulk work on foreground quiet time; cancelling running results retains the slot until actual task settlement.
 * @evidence contracts/common.md#clear-and-simple-design Three waiting arrays, one running record and one quiet timer express scheduling while each entry owns its abort listener and deferred task.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Waiting cancellation removes the actual entry and running cancellation never pretends to stop page work; invalid limit and patience refuse before admission.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains lane ordering, CLI starvation relief, bulk quiet time, visible queue status and cancellation versus actual task-promise settlement without claiming physical retirement.
 * @evidence contracts/performance.md#efficient-algorithms Picking scans three fixed lanes; FIFO shift and waiting cancellation splice cost linear work in a lane bounded by limit, while one unsettled callback owns the GPU slot.
 * @evidence contracts/performance.md#reuse-equivalent-work Requests retain their own task and cancellation authority and are never merged merely by equal labels; one pending quiet timer coalesces scheduler wakeups.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each lane retains at most limit waiting entries plus one actual unsettled task; settled or cancelled waiting entries remove abort listeners, one bulk wakeup may remain pending and this adapter has no separate shutdown/cancel-all seam.
 */
export function createHumanViewerQueue(props: ICreateHumanViewerQueueProps): {
  run: <T>(label: string, task: () => Promise<T>, lane?: HumanViewerLane, signal?: AbortSignal) => Promise<T>;
  status: () => IHumanViewerQueueStatus;
} {
  if (!Number.isInteger(props.limit) || props.limit < 1)
    throw new Error("The queue limit must be a positive integer");
  if (!Number.isInteger(props.patience) || props.patience < 1)
    throw new Error("The queue patience must be a positive integer");
  /**
   * One queued request's label and deferred start operation.
   *
   * @author Samchon
   */
  interface IEntry {
    label: string;
    start: () => Promise<void>;
  }
  const lines: Record<HumanViewerLane, IEntry[]> = {
    ui: [],
    cli: [],
    bulk: [],
  };
  let running: IHumanViewerQueueRunning | null = null;
  let last: IHumanViewerQueueStatus["last"] = null;
  let streak: number = 0;
  let foregroundAt: number = Number.NEGATIVE_INFINITY;
  let timer: boolean = false;
  const quiet: () => boolean = (): boolean =>
    (props.quietMs ?? 0) <= 0 ||
    props.now() - foregroundAt >= (props.quietMs ?? 0);
  const pick: () => IEntry | undefined = (): IEntry | undefined => {
    const order: readonly HumanViewerLane[] =
      streak >= props.patience && lines.cli.length !== 0
        ? (["cli", "ui", "bulk"] as const)
        : LANES;
    for (const lane of order)
      if (lines[lane].length !== 0 && (lane !== "bulk" || quiet())) {
        streak = lane === "ui" ? streak + 1 : 0;
        return lines[lane].shift();
      }
    return undefined;
  };
  const drain: () => void = (): void => {
    if (running !== null) return;
    const entry: IEntry | undefined = pick();
    if (entry !== undefined) void entry.start();
    else if (lines.bulk.length !== 0 && !timer) {
      // Only gated bulk work waits: look again when the quiet period can end.
      timer = true;
      (props.later ?? ((run: () => void, ms: number): void => { setTimeout(run, ms); }))(
        (): void => {
          timer = false;
          drain();
        },
        Math.max(1, (props.quietMs ?? 0) - (props.now() - foregroundAt)),
      );
    }
  };
  return {
    run: <T>(
      label: string,
      task: () => Promise<T>,
      lane: HumanViewerLane = "cli",
      signal?: AbortSignal,
    ): Promise<T> => {
      if (signal?.aborted) return Promise.reject(signal.reason);
      if (lines[lane].length >= props.limit)
        return Promise.reject(
          new HumanViewerQueueFullError(
            `${lines[lane].length} ${lane} requests are already waiting behind ${running?.label ?? "the running one"}; retry later`,
          ),
        );
      if (lane !== "bulk") foregroundAt = props.now();
      return new Promise<T>((resolve: (value: T | PromiseLike<T>) => void, reject: (error: unknown) => void): void => {
        let started: boolean = false;
        let cancelled: boolean = false;
        const entry: IEntry = {
          label,
          start: async (): Promise<void> => {
            started = true;
            const start: number = props.now();
            running = { label, start };
            let failed: boolean = true;
            try {
              signal?.throwIfAborted();
              const result: T = await task();
              if (!cancelled) {
                resolve(result);
                failed = false;
              }
            } catch (error) {
              reject(error);
            } finally {
              signal?.removeEventListener("abort", abort);
              if (lane !== "bulk") foregroundAt = props.now();
              last = { label, ms: props.now() - start, failed };
              running = null;
              drain();
            }
          },
        };
        const abort: () => void = (): void => {
          cancelled = true;
          reject(signal!.reason);
          if (!started) {
            // A not-started entry still belongs to exactly this lane.
            lines[lane].splice(lines[lane].indexOf(entry), 1);
            signal!.removeEventListener("abort", abort);
            drain();
          }
        };
        lines[lane].push(entry);
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) abort();
        else drain();
      });
    },
    status: (): IHumanViewerQueueStatus => ({
      waiting: {
        ui: lines.ui.length,
        cli: lines.cli.length,
        bulk: lines.bulk.length,
      },
      running: running?.label ?? null,
      runningMs: running === null ? null : props.now() - running.start,
      last,
    }),
  };
}
