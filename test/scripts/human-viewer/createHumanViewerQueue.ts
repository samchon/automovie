import type { HumanViewerLane } from "./HumanViewerLane";
import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError";
import type { ICreateHumanViewerQueueProps } from "./ICreateHumanViewerQueueProps";
import type { IHumanViewerQueueRunning } from "./IHumanViewerQueueRunning";
import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus";

const LANES: readonly HumanViewerLane[] = ["ui", "cli", "bulk"];

/**
 * The one GPU page every request shares, served in three lanes: `ui` for a
 * person waiting on the screen, `cli` for scripted captures and `bulk` for
 * thumbnails and pre-building. A request in a higher lane starts before every
 * waiting request of a lower one, and requests of a lane run in arrival
 * order; a running request is never cut off. So that a busy person cannot
 * starve the scripts, after `patience` consecutive `ui` starts a waiting `cli`
 * request goes next. A request that finds `limit` others already waiting in
 * its lane is refused at once with the reason instead of joining a line no one
 * can see the end of. A `bulk` request is also held back until no `ui` or
 * `cli` request has arrived or finished for `quietMs`, so background work
 * never starts in front of a person or script that is about to ask: a script
 * whose own capture ran longer than `quietMs` would otherwise find a bulk
 * build started in the few milliseconds before its next request, and wait
 * for that whole build. The status names the running request and each lane's
 * length so a stalled server can be told from a busy one.
 * A cancelled waiting entry is removed before its callback starts. Cancelling
 * a running requester rejects its result but retains the GPU slot until the
 * actual task settles; rejecting a promise does not stop work on the page.
 */
export function createHumanViewerQueue(props: ICreateHumanViewerQueueProps) {
  if (!Number.isInteger(props.limit) || props.limit < 1)
    throw new Error("The queue limit must be a positive integer");
  if (!Number.isInteger(props.patience) || props.patience < 1)
    throw new Error("The queue patience must be a positive integer");
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
  let streak = 0;
  let foregroundAt = Number.NEGATIVE_INFINITY;
  let timer = false;
  const quiet = (): boolean =>
    (props.quietMs ?? 0) <= 0 ||
    props.now() - foregroundAt >= (props.quietMs ?? 0);
  const pick = (): IEntry | undefined => {
    const order =
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
  const drain = (): void => {
    if (running !== null) return;
    const entry = pick();
    if (entry !== undefined) void entry.start();
    else if (lines.bulk.length !== 0 && !timer) {
      // Only gated bulk work waits: look again when the quiet period can end.
      timer = true;
      (props.later ?? ((run, ms) => void setTimeout(run, ms)))(
        () => {
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
      return new Promise<T>((resolve, reject) => {
        let started = false;
        let cancelled = false;
        const entry: IEntry = {
          label,
          start: async () => {
            started = true;
            const start = props.now();
            running = { label, start };
            let failed = true;
            try {
              signal?.throwIfAborted();
              const result = await task();
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
        const abort = (): void => {
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
