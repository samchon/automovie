import type { IReviewCapture } from "./IReviewCapture";

/**
 * A capture run's common authority and per-frame identities. The body caller
 * refuses mixed source or device frames before constructing this record.
 * @author Samchon
 */
export interface IReviewCaptureRecord {
  /** Subject domain observed by the capture driver. */
  kind: "body" | "face";

  /** First actual frame's device, or the connection report when no frames exist. */
  renderer: string;

  /** First actual frame's source digest, or the connection digest when no frames exist. */
  revision: string;

  /** Whether the run contains actual current frames; an empty run must not claim freshness. */
  humanBuildFresh: boolean;

  /** Frames in draw order, with byte-derived identities and their individual authority. */
  captures: IReviewCapture[];
}
