import type { IAutoMoviePhysicalSegmentState } from "./IAutoMoviePhysicalSegmentState";

/**
 * A completed cache sample or an interpolated display sample of every admitted
 * segment.
 *
 * Seconds is local film time from zero; bodies indexes scene body then bone,
 * with each segment represented in world SI coordinates. Simulation stores
 * completed samples; cache.at and playback.at allocate detached sampled records
 * at arbitrary valid seconds. The frame carries no native contacts or
 * controller memory and cannot restart simulation. Body/segment completeness is
 * enforced by producers and motion-frame admission.
 */
export interface IAutoMoviePhysicalFrame {
  /**
   * Local film seconds from zero; may lie between cached instants when returned
   * by at.
   */
  seconds: number;

  /**
   * Complete world segment states indexed first by scene body id, then by bone
   * id; no native handles are retained.
   */
  bodies: Record<string, Record<string, IAutoMoviePhysicalSegmentState>>;
}
