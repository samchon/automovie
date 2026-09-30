import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError";

/** What the server reports about its request queue. */
export interface IHumanViewerQueueStatus {
  /** Requests accepted and not yet started. */
  waiting: number;

  /** The label of the request the GPU page is working on, or null when idle. */
  running: string | null;

  /** Milliseconds the running request has been going. */
  runningMs: number | null;

  /** The last request that finished, with its duration, or null before the first. */
  last: { label: string; ms: number; failed: boolean } | null;
}

/**
 * The one lane GPU requests share. Requests run one at a time in the order
 * they arrive, and a request that finds `limit` others already waiting is
 * refused at once with the reason instead of joining a line no one can see the
 * end of. The status names the running request and the length of the line so
 * a stalled server can be told from a busy one.
 */
export function createHumanViewerQueue(props: {
  limit: number;
  now: () => number;
}) {
  if (!Number.isInteger(props.limit) || props.limit < 1)
    throw new Error("The queue limit must be a positive integer");
  let tail: Promise<void> = Promise.resolve();
  let waiting = 0;
  let running: { label: string; start: number } | null = null;
  let last: IHumanViewerQueueStatus["last"] = null;
  return {
    run: <T>(label: string, task: () => Promise<T>): Promise<T> => {
      if (waiting >= props.limit)
        return Promise.reject(
          new HumanViewerQueueFullError(
            `${waiting} requests are already waiting behind ${running?.label ?? "the running one"}; retry later`,
          ),
        );
      ++waiting;
      const result = tail.then(async () => {
        --waiting;
        const start = props.now();
        running = { label, start };
        let failed = true;
        try {
          const value = await task();
          failed = false;
          return value;
        } finally {
          last = { label, ms: props.now() - start, failed };
          running = null;
        }
      });
      tail = result.then(() => {}).catch(() => {});
      return result;
    },
    status: (): IHumanViewerQueueStatus => ({
      waiting,
      running: running?.label ?? null,
      runningMs: running === null ? null : props.now() - running.start,
      last,
    }),
  };
}

