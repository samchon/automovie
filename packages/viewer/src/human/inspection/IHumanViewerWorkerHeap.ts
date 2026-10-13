import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * One dedicated worker's own V8 heap reading. A worker is a separate isolate that shares the renderer process's pointer cage with the page, so the page reading alone does not show how close the process is to its limit.
 *
 * @evidence contracts/common.md#principled-implementation Each dedicated worker reports its own isolate heap alongside its script URL.
 * @evidence contracts/common.md#clear-and-simple-design A worker-specific record complements page accounting without folding independent isolates into one guessed reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker usage comes from its heap reader rather than an estimate derived from the page's heap.
 * @evidence contracts/common.md#meaningful-documentation Explains the separate worker isolate, shared renderer process and URL-to-usage association.
 * @author Samchon
 */
export interface IHumanViewerWorkerHeap {
  /** The worker script URL. */
  url: string;

  /** Its heap reading. */
  usage: IHumanViewerHeapUsage;
}
