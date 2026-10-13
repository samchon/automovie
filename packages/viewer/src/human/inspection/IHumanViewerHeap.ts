import type { IHumanViewerHeapPeak } from "./IHumanViewerHeapPeak.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * What `/health` reports about the resident page's JavaScript heap: the last
 * reading, the peak since the server started and how many readings were
 * taken. Readings are taken at each work-stage transition the page reports,
 * so a transient allocation inside one stage can exceed the recorded peak.
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
