import type { HumanViewerLane } from "./HumanViewerLane";
import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus";
import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError";

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
 * can see the end of. The status names the running request and each lane's
 * length so a stalled server can be told from a busy one.
 */
export function createHumanViewerQueue(props: {
  limit: number;
  patience: number;
  now: () => number;
}) {
  if (!Number.isInteger(props.limit) || props.limit < 1)
    throw new Error("The queue limit must be a positive integer");
  if (!Number.isInteger(props.patience) || props.patience < 1)
    throw new Error("The queue patience must be a positive integer");
  interface IEntry {
    label: string;
    start: () => Promise<void>;
  }
  const lines: Record<HumanViewerLane, IEntry[]> = { ui: [], cli: [], bulk: [] };
  let running: { label: string; start: number } | null = null;
  let last: IHumanViewerQueueStatus["last"] = null;
  let streak = 0;
  const pick = (): IEntry | undefined => {
    const order =
      streak >= props.patience && lines.cli.length !== 0
        ? (["cli", "ui", "bulk"] as const)
        : LANES;
    for (const lane of order)
      if (lines[lane].length !== 0) {
        streak = lane === "ui" ? streak + 1 : 0;
        return lines[lane].shift();
      }
    return undefined;
  };
  const drain = (): void => {
    if (running !== null) return;
    const entry = pick();
    if (entry !== undefined) void entry.start();
  };
  return {
    run: <T>(
      label: string,
      task: () => Promise<T>,
      lane: HumanViewerLane = "cli",
    ): Promise<T> => {
      if (lines[lane].length >= props.limit)
        return Promise.reject(
          new HumanViewerQueueFullError(
            `${lines[lane].length} ${lane} requests are already waiting behind ${running?.label ?? "the running one"}; retry later`,
          ),
        );
      return new Promise<T>((resolve, reject) => {
        lines[lane].push({
          label,
          start: async () => {
            const start = props.now();
            running = { label, start };
            let failed = true;
            try {
              resolve(await task());
              failed = false;
            } catch (error) {
              reject(error);
            } finally {
              last = { label, ms: props.now() - start, failed };
              running = null;
              drain();
            }
          },
        });
        drain();
      });
    },
    status: (): IHumanViewerQueueStatus => ({
      waiting: { ui: lines.ui.length, cli: lines.cli.length, bulk: lines.bulk.length },
      running: running?.label ?? null,
      runningMs: running === null ? null : props.now() - running.start,
      last,
    }),
  };
}
