/**
 * Compute revision digests outside the server's event loop. The worker owns its source-text cache and answers each edit batch with current digests, moved domains and reached paths; graph parsing and byte hashing still consume their actual CPU and filesystem work, without a fixed timing claim.
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
  runtimeRoots: init.runtimeRoots,
  io: createNodeHumanViewerResolveIo(init.root, init.runtimeRoots),
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
