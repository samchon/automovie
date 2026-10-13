/**
 * The revision digests computed off the server's event loop. Following the
 * import graphs and hashing every reached file takes half a second or more of
 * synchronous work per edit batch; on the server's own thread it held every
 * request, `/health` included, while edits kept arriving. This worker keeps
 * its own file caches and answers each batch with the new digests, the moved
 * domains and the reached files.
 */
import { parentPort, workerData } from "node:worker_threads";

import type { IHumanViewerRevisionsChange } from "./IHumanViewerRevisionsChange.js";
import type { IHumanViewerRevisionsReply } from "./IHumanViewerRevisionsReply.js";
import type { IHumanViewerRevisionsWorkerInit } from "./IHumanViewerRevisionsWorkerInit.js";
import { createHumanViewerRevisions } from "./createHumanViewerRevisions.js";
import { createNodeHumanViewerResolveIo } from "./createNodeHumanViewerResolveIo.js";

const init = workerData as IHumanViewerRevisionsWorkerInit;
let bases = init.bases;
const revisions = createHumanViewerRevisions({
  root: init.root,
  entries: init.entries,
  extra: init.extra,
  checkedInputs: init.checkedInputs,
  bases: () => bases,
  io: createNodeHumanViewerResolveIo(init.root),
});
parentPort!.on("message", (change: IHumanViewerRevisionsChange) => {
  let reply: IHumanViewerRevisionsReply;
  try {
    bases = change.bases;
    const { moved } = revisions.changed(change.files);
    reply = {
      revisions: revisions.current(),
      moved,
      reached: revisions.reached(),
      error: null,
    };
  } catch (error) {
    reply = {
      revisions: revisions.current(),
      moved: [],
      reached: revisions.reached(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
  parentPort!.postMessage(reply);
});
