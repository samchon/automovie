import type { ServerResponse } from "node:http";

import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";

/**
 * What the `/heap` route reads and answers with.
 *
 * @author Samchon
 */
export interface IServeHumanViewerHeapProps {
  /** The response, given status 503 when no reading can be taken. */
  response: ServerResponse;

  /** Send a JSON answer. */
  json: (value: unknown) => void;

  /** Collect the page's garbage, then read its heap. */
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;

  /** Collect each worker's garbage, then read its heap. */
  readWorkerHeaps: () => Promise<IHumanViewerWorkerHeap[]>;

  /** The page's latest progress record. */
  work: () => HumanViewerWork | null;

  /** The generation the page can draw. */
  readyRevision: () => string;
}
