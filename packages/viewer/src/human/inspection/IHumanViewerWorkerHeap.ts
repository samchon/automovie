import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * One dedicated worker's own V8 heap reading. A worker is a separate isolate that shares the renderer process's pointer cage with the page, so the page reading alone does not show how close the process is to its limit.
 *
 * @author Samchon
 */
export interface IHumanViewerWorkerHeap {
  /** The worker script URL. */
  url: string;

  /** Its heap reading. */
  usage: IHumanViewerHeapUsage;
}
