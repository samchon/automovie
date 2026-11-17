import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject.js";

/**
 * A parsed capture request, host description and detected cut instants. planAutoMovieCapture resolves named events and views, computes the sampling windows and cell product, and refuses unsupported selections before the host begins drawing. Inputs remain caller-owned.
 *
 * @evidence contracts/development/design.md#principled-representation Inputs remain caller-owned.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieCapture exchanges request, subject, cuts; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs remain caller-owned.
 * @evidence contracts/development/common.md#meaningful-documentation A parsed capture request, host description and detected cut instants. planAutoMovieCapture resolves named events and views, computes the sampling windows and cell product, and refuses unsupported selections before the host begins drawing. The prose and members document how planAutoMovieCapture interprets and admits these values.
 */
export interface IAutoMovieCapturePlanProps {
  /** What the capture asks for. */
  request: IAutoMovieCapturePlanRequest;

  /** What the host learned of the subject. */
  subject: IAutoMovieCaptureSubject;

  /** Seconds of the scene cuts detected in a video file, whose surrounding frames are drawn like an event's; empty for a drawn scene. */
  cuts: readonly number[];
}
