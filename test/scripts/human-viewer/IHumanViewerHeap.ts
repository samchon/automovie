import type { IHumanViewerHeapPeak } from "./IHumanViewerHeapPeak";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";

/**
 * What `/health` reports about the resident page's JavaScript heap: the last
 * reading, the peak since the server started and how many readings were
 * taken. Readings are taken at each work-stage transition the page reports,
 * so a transient allocation inside one stage can exceed the recorded peak.
 *
 * @evidence contracts/common.md#principled-implementation Reports measured heap use beside the work stage instead of inferring memory from counts.
 * @evidence contracts/common.md#meaningful-documentation States when readings are taken and what they can miss.
 * @author Samchon
 */
export interface IHumanViewerHeap {
  /** The most recent reading, or null before the first. */
  last: IHumanViewerHeapUsage | null;

  /** The largest reading so far, or null before the first. */
  peak: IHumanViewerHeapPeak | null;

  /** Readings taken since the server started. */
  samples: number;

  /** Why the most recent reading failed, or null when it succeeded or none was tried. */
  unavailable: string | null;
}
