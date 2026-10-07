import type { ServerResponse } from "node:http";

import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap";

/**
 * What the `/heap` route reads and answers with.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
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
