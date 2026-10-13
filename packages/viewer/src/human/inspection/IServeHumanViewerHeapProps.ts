import type { ServerResponse } from "node:http";

import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";

/**
 * What the `/heap` route reads and answers with.
 *
 * @evidence contracts/common.md#principled-implementation Heap reporting reads the page and worker isolates separately and preserves the associated progress and drawable revision.
 * @evidence contracts/common.md#clear-and-simple-design The route borrows live-heap readers and current-state accessors while the host owns collection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing reading is represented by the response's unavailable status rather than an invented zero heap.
 * @evidence contracts/common.md#meaningful-documentation Documents collection operations, independent worker readings, latest work and generation context.
 * @author Samchon
 */
export interface IServeHumanViewerHeapProps {
  /** The response, given status 503 when no reading can be taken. */
  response: ServerResponse;

  /**
   * Send a JSON answer.
   *
   * @evidence contracts/common.md#principled-implementation Heap JSON output forwards measured usage and accompanying route status.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP host owns serialization independently of heap collection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A response callback cannot replace unavailable readings with guessed usage.
   * @evidence contracts/common.md#meaningful-documentation Defines the heap route's JSON output operation.
   */
  json: (value: unknown) => void;

  /**
   * Collect the page's garbage, then read its heap.
   *
   * @evidence contracts/common.md#principled-implementation Live page usage is read after garbage collection in the actual page isolate.
   * @evidence contracts/common.md#clear-and-simple-design The page measurement owner retains collection/read ordering.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A collected page heap does not account for worker isolates by inference.
   * @evidence contracts/common.md#meaningful-documentation Documents page collection followed by typed heap measurement.
   */
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;

  /**
   * Collect each worker's garbage, then read its heap.
   *
   * @evidence contracts/common.md#principled-implementation Each actual worker isolate is collected and read separately.
   * @evidence contracts/common.md#clear-and-simple-design The worker observer owns target sessions and supplies typed per-worker results.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker memory is not guessed from page memory or the number of workers.
   * @evidence contracts/common.md#meaningful-documentation Documents independent collected heap readings for worker targets.
   */
  readWorkerHeaps: () => Promise<IHumanViewerWorkerHeap[]>;

  /**
   * The page's latest progress record.
   *
   * @evidence contracts/common.md#principled-implementation Work access reports the page's latest progress record or null before one exists.
   * @evidence contracts/common.md#clear-and-simple-design Progress state remains host-owned and is read through one accessor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent progress is preserved as null rather than invented completion.
   * @evidence contracts/common.md#meaningful-documentation Defines the latest progress reading and its unavailable state.
   */
  work: () => HumanViewerWork | null;

  /**
   * The generation the page can draw.
   *
   * @evidence contracts/common.md#principled-implementation The heap response carries the generation the page can presently draw.
   * @evidence contracts/common.md#clear-and-simple-design The generation owner supplies readiness independently of heap measurement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful heap read does not imply current-source display readiness.
   * @evidence contracts/common.md#meaningful-documentation Names the drawable generation accompanying the memory report.
   */
  readyRevision: () => string;
}
