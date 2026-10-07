import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";

/**
 * One dedicated worker's own V8 heap reading. A worker is a separate isolate
 * that shares the renderer process's pointer cage with the page, so the page
 * reading alone does not show how close the process is to its limit.
 *
 * @evidence contracts/common.md#principled-implementation Reads each isolate's own accounting instead of inferring the worker's size.
 * @evidence contracts/common.md#meaningful-documentation States why the worker is read apart.
 * @author Samchon
 */
export interface IHumanViewerWorkerHeap {
  /** The worker script URL. */
  url: string;

  /** Its heap reading. */
  usage: IHumanViewerHeapUsage;
}
