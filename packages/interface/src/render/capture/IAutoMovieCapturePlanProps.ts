import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject.js";

/**
 * A parsed capture request, host description and detected cut instants.
 * planAutoMovieCapture resolves named events and views, computes the sampling
 * windows and cell product, and refuses unsupported selections before the host
 * begins drawing. Inputs remain caller-owned.
 */
export interface IAutoMovieCapturePlanProps {
  /** What the capture asks for. */
  request: IAutoMovieCapturePlanRequest;

  /** What the host learned of the subject. */
  subject: IAutoMovieCaptureSubject;

  /**
   * Seconds of the scene cuts detected in a video file, whose surrounding
   * frames are drawn like an event's; empty for a drawn scene.
   */
  cuts: readonly number[];
}
