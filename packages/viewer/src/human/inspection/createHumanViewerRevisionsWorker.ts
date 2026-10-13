import { Worker } from "node:worker_threads";

import type { ICreateHumanViewerRevisionsWorkerProps } from "./ICreateHumanViewerRevisionsWorkerProps.js";
import type { IHumanViewerMovedDomains } from "./IHumanViewerMovedDomains.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerRevisionsChange } from "./IHumanViewerRevisionsChange.js";
import type { IHumanViewerRevisionsReply } from "./IHumanViewerRevisionsReply.js";
import type { IHumanViewerRevisionsWorkerInit } from "./IHumanViewerRevisionsWorkerInit.js";
import { createHumanViewerRevisions } from "./createHumanViewerRevisions.js";

/**
 * The server's revision owner. The first digests are computed here while the
 * server starts, before it listens, so the first catalogue has them; every
 * later edit batch is computed by the worker module (`revisions-worker.mts`) on a thread of its
 * own, so the event loop keeps answering requests while edits arrive.
 * Batches are answered in the order they were sent; `current` and `reaches`
 * read the last answer and never wait. A worker that fails or exits refuses
 * every batch after it with that cause.
 * The checked input scope is transferred unchanged to that worker and stays
 * with the existing Node witness reader. Source reach includes dynamic additions
 * in those checked roots, even when no executed module imports the new file.
 */
export function createHumanViewerRevisionsWorker(
  props: ICreateHumanViewerRevisionsWorkerProps,
) {
  const first = createHumanViewerRevisions(props);
  let current: IHumanViewerRevisions = first.current();
  let reached = new Set(first.reached());
  const init: IHumanViewerRevisionsWorkerInit = {
    checkedInputs: props.checkedInputs,
    root: props.root,
    entries: props.entries,
    extra: [...props.extra],
    bases: props.bases(),
  };
  const worker = new Worker(props.worker, { workerData: init });
  // The worker must not keep a stopping server alive.
  worker.unref();
  const waiting: ((reply: IHumanViewerRevisionsReply) => void)[] = [];
  let failure: Error | null = null;
  const fail = (error: Error): void => {
    failure = error;
    for (const settle of waiting.splice(0))
      settle({
        revisions: current,
        moved: [],
        reached: [...reached],
        error: error.message,
      });
  };
  worker.on("message", (reply: IHumanViewerRevisionsReply) =>
    waiting.shift()?.(reply),
  );
  worker.on("error", fail);
  worker.on("exit", (code) =>
    fail(new Error(`The revision worker exited with code ${code}`)),
  );
  return {
    /** The last computed digests. */
    current: (): IHumanViewerRevisions => current,

    /** Whether a graph dependency or dynamically added checked-loader input can change source admission. */
    reaches: (file: string): boolean => reached.has(file) || first.reaches(file),

    /** Compute the digests after an edit batch on the worker and name the moved domains. */
    changed: async (files: string[]): Promise<IHumanViewerMovedDomains> => {
      if (failure !== null) throw failure;
      const reply = await new Promise<IHumanViewerRevisionsReply>((resolve) => {
        waiting.push(resolve);
        const change: IHumanViewerRevisionsChange = {
          files,
          bases: props.bases(),
        };
        worker.postMessage(change);
      });
      if (reply.error !== null)
        throw new Error("Revision digests failed: " + reply.error);
      current = reply.revisions;
      reached = new Set(reply.reached);
      return { moved: reply.moved };
    },
  };
}
