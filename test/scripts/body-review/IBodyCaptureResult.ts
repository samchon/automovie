import type { IBodyCaptureRefusal } from "./IBodyCaptureRefusal";
import type { IBodyDrawnFrame } from "./IBodyDrawnFrame";

/**
 * Actual results of one body capture run. Drawn frames share one response
 * revision and device; a change during the run throws instead of mixing them.
 * @author Samchon
 */
export interface IBodyCaptureResult {
  /** Successful PNGs in requested order, owned by this result for writing and recording. */
  drawn: IBodyDrawnFrame[];

  /** Named refusals recorded when onRefused selected record; absent frames are not observations. */
  refused: IBodyCaptureRefusal[];
}
