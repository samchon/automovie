import type { IHumanViewerHeapPeak } from "./IHumanViewerHeapPeak.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * The page heap gauge's last successful reading, largest sampled usage and successful sample count. Work events trigger asynchronous samples, and events arriving during a pending read are absorbed. Within-stage transients can exceed the recorded peak.
 *
 * @evidence contracts/common.md#principled-implementation Reports actual page-isolate last/peak usage, successful sample count and latest unavailable cause from the single-flight heap gauge.
 * @evidence contracts/common.md#clear-and-simple-design Keeps measured usage/peak provenance separate from retained array-byte budget and worker heap totals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stage-triggered asynchronous sampling can miss within-stage transients and absorbs events while busy; failure preserves prior actual reading.
 * @evidence contracts/common.md#meaningful-documentation Defines null before successful observation and failure semantics; the peak is sampled evidence, not a guaranteed process/GPU memory maximum.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no sampling; the gauge performs fixed comparisons around the actual CDP query.
 * @evidence contracts/performance.md#reuse-equivalent-work Last/global peak readings are retained for status; new samples reread heap and window epochs keep pre-mark results out of later captures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One pending sample, one last reading, one peak and scalar window state remain; a never-settling reader stays busy without multiplying tasks.
 *
 * @author Samchon
 */
export interface IHumanViewerHeap {
  /** The most recent reading, or null before the first. */
  last: IHumanViewerHeapUsage | null;

  /** The largest reading so far, or null before the first. */
  peak: IHumanViewerHeapPeak | null;

  /** Readings taken since the server started. */
  samples: number;

  /**
   * Why the most recent reading failed, or null when it succeeded or none was tried.
   */
  unavailable: string | null;
}
