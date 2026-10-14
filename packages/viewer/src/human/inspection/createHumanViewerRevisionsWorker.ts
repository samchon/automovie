import { Worker } from "node:worker_threads";

import type { ICreateHumanViewerRevisionsWorkerProps } from "./ICreateHumanViewerRevisionsWorkerProps.js";
import type { IHumanViewerMovedDomains } from "./IHumanViewerMovedDomains.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerRevisionsChange } from "./IHumanViewerRevisionsChange.js";
import type { IHumanViewerRevisionsReply } from "./IHumanViewerRevisionsReply.js";
import type { IHumanViewerRevisionsWorkerInit } from "./IHumanViewerRevisionsWorkerInit.js";
import { createHumanViewerRevisions } from "./createHumanViewerRevisions.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

/**
 * The server's revision owner. The first digests are computed here while the server starts, before it listens, so the first catalogue has them; every later edit batch is computed by the worker module (`revisions-worker.mts`) on a thread of its own, so the event loop keeps answering requests while edits arrive. Batches are answered in the order they were sent; `current` and `reaches` read the last answer and never wait. A worker that fails or exits refuses every batch after it with that cause. The checked input scope is transferred unchanged to that worker and stays with the existing Node witness reader. Source reach includes dynamic additions in those checked roots, even when no executed module imports the new file. Close rejects queued requests and awaits actual worker termination; unref only controls process liveness and does not release a running worker.
 *
 * @evidence contracts/common.md#principled-implementation Initial digests are synchronous and later edit batches use the revision worker FIFO; current and reaches read actual last replies while failures refuse pending and future work.
 * @evidence contracts/common.md#clear-and-simple-design One worker, a FIFO resolver queue and last revision/reach state separate off-thread computation from immediate server reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker errors and exits preserve a failure instead of returning fabricated digests; postMessage failure removes its exact waiter and unref is not claimed as termination.
 * @evidence contracts/common.md#meaningful-documentation The comment defines startup versus later work, checked-loader reach and explicit close settlement.
 * @evidence contracts/performance.md#efficient-algorithms Revision hashing is delegated off-thread; each batch adds and shifts a FIFO waiter, and replies replace the reached-path set in linear work in graph size.
 * @evidence contracts/performance.md#reuse-equivalent-work The first revision owner supplies immediate state; subsequent current reads reuse only the latest completed reply, while each edit batch recomputes through its owning worker.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending batches have no independent numeric cap; settlement or worker failure removes waiters, and close refuses further requests, drains pending waits, awaits termination and removes listeners with shared failure history.
 */
export function createHumanViewerRevisionsWorker(
  props: ICreateHumanViewerRevisionsWorkerProps,
): {
  current: () => IHumanViewerRevisions;
  reaches: (file: string) => boolean;
  changed: (files: string[]) => Promise<IHumanViewerMovedDomains>;
  close: () => Promise<void>;
} {
  const first: ReturnType<typeof createHumanViewerRevisions> = createHumanViewerRevisions(props);
  let current: IHumanViewerRevisions = first.current();
  let reached: Set<string> = new Set(first.reached());
  const init: IHumanViewerRevisionsWorkerInit = {
    checkedInputs: props.checkedInputs,
    root: props.root,
    entries: props.entries,
    extra: [...props.extra],
    bases: props.bases(),
  };
  const worker: Worker = new Worker(props.worker, { workerData: init });
  // The worker must not keep a stopping server alive.
  worker.unref();
  const waiting: ((reply: IHumanViewerRevisionsReply) => void)[] = [];
  let failure: Error | null = null;
  let closed: boolean = false;
  const fail: (error: Error) => void = (error: Error): void => {
    failure ??= error;
    for (const settle of waiting.splice(0))
      settle({
        revisions: current,
        moved: [],
        reached: [...reached],
        error: failure.message,
      });
  };
  const message: (reply: IHumanViewerRevisionsReply) => void = (reply: IHumanViewerRevisionsReply): void => {
    waiting.shift()?.(reply);
  };
  const exit: (code: number) => void = (code: number): void => {
    fail(new Error(`The revision worker exited with code ${code}`));
  };
  worker.on("message", message);
  worker.on("error", fail);
  worker.on("exit", exit);
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    async (): Promise<void> => { await worker.terminate(); },
    (): void => {
      worker.off("message", message);
      worker.off("error", fail);
      worker.off("exit", exit);
    },
  ]);
  return {
    /** The last computed digests. */
    current: (): IHumanViewerRevisions => current,

    /** Whether a graph dependency or dynamically added checked-loader input can change source admission. */
    reaches: (file: string): boolean => reached.has(file) || first.reaches(file),

    /** Compute the digests after an edit batch on the worker and name the moved domains. */
    changed: async (files: string[]): Promise<IHumanViewerMovedDomains> => {
      if (failure !== null) throw failure;
      const reply: IHumanViewerRevisionsReply = await new Promise<IHumanViewerRevisionsReply>((resolve: (reply: IHumanViewerRevisionsReply) => void, reject: (error: unknown) => void): void => {
        const change: IHumanViewerRevisionsChange = {
          files,
          bases: props.bases(),
        };
        waiting.push(resolve);
        try {
          worker.postMessage(change);
        } catch (error) {
          waiting.splice(waiting.indexOf(resolve), 1);
          reject(error);
        }
      });
      if (reply.error !== null)
        throw new Error("Revision digests failed: " + reply.error);
      if (failure !== null) throw failure;
      current = reply.revisions;
      reached = new Set(reply.reached);
      return { moved: reply.moved };
    },
    /** Refuse pending and future batches and await this owner's worker retirement. */
    close: (): Promise<void> => {
      if (!closed) {
        closed = true;
        fail(new Error("The revision owner is closed"));
      }
      return retire();
    },
  };
}
