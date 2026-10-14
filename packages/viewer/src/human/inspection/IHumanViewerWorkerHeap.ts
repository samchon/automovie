import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * One dedicated worker target's V8 heap reading, separate from the page-isolate reading. CDP target sampling does not independently measure OS-process placement, a shared pointer cage, process-wide memory or GPU storage.
 *
 * @evidence contracts/common.md#principled-implementation Worker script URL and V8 usage describe a separate isolate whose heap is not included in the page's own heap reading.
 * @evidence contracts/common.md#clear-and-simple-design The per-worker report reuses the shared heap-usage shape instead of mixing page and worker measurements into one ambiguous number.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record reports actual worker-isolate readings rather than assigning estimated model bytes to each worker.
 * @evidence contracts/common.md#meaningful-documentation Comments identify worker URL, separate isolate usage and the unmeasured process-placement and native-storage boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The worker-heap record chooses no CDP target enumeration or heap sampling algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An isolate reading is time-specific and provides no cached authority after worker replacement.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The report retains no attached CDP worker session; readHumanViewerWorkerHeaps owns attachment and teardown.
 *
 * @author Samchon
 */
export interface IHumanViewerWorkerHeap {
  /** The worker script URL. */
  url: string;

  /** Its heap reading. */
  usage: IHumanViewerHeapUsage;
}
