/**
 * The revision digests computed off the server's event loop. Following the
 * import graphs and hashing every reached file takes half a second or more of
 * synchronous work per edit batch; on the server's own thread it held every
 * request, `/health` included, while edits kept arriving. This worker keeps
 * its own file caches and answers each batch with the new digests, the moved
 * domains and the reached files.
 */
import { parentPort, workerData } from "node:worker_threads";

import type { IHumanViewerRevisionsChange } from "./IHumanViewerRevisionsChange";
import type { IHumanViewerRevisionsReply } from "./IHumanViewerRevisionsReply";
import type { IHumanViewerRevisionsWorkerInit } from "./IHumanViewerRevisionsWorkerInit";
import { createHumanViewerRevisions } from "./createHumanViewerRevisions";
import { createNodeHumanViewerResolveIo } from "./createNodeHumanViewerResolveIo";

const init = workerData as IHumanViewerRevisionsWorkerInit;
let bases = init.bases;
const revisions = createHumanViewerRevisions({
  root: init.root,
  entries: init.entries,
  extra: init.extra,
  bases: () => bases,
  io: createNodeHumanViewerResolveIo(),
});
parentPort!.on("message", (change: IHumanViewerRevisionsChange) => {
  let reply: IHumanViewerRevisionsReply;
  try {
    bases = change.bases;
    const { moved } = revisions.changed(change.files);
    reply = { revisions: revisions.current(), moved, reached: revisions.reached(), error: null };
  } catch (error) {
    reply = { revisions: revisions.current(), moved: [], reached: revisions.reached(),
      error: error instanceof Error ? error.message : String(error) };
  }
  parentPort!.postMessage(reply);
});
