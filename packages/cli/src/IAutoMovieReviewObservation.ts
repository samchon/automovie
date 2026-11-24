import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

/**
 * A review mark bound to the published file and the inspection its reviewer
 * explicitly reports.
 */
export interface IAutoMovieReviewObservation {
  /** The receipt format. */
  version: 1;
  /** The delivered subject named by its published render report. */
  subject: string;
  /** The video path, production-relative when possible, with forward slashes. */
  file: string;
  /** Lowercase SHA-256 of the complete file, including its soundtrack. */
  sha256: string;
  /** The reviewer's original description of the issue or observation. */
  note: string;
  /** The explicitly named reviewer, or null for a navigation mark. */
  reviewer: string | null;
  /**
   * The reviewer's decision on the requested scope, or null for a navigation
   * mark.
   */
  decision: "accepted" | "needs-repair" | null;
  /** What the reviewer explicitly inspected, or null for a navigation mark. */
  viewed: "still" | "playback" | "listening" | null;
  /**
   * The selected film time in seconds, or half-open interval when to is
   * present.
   */
  requested: { from: number; to: number | null };
  /**
   * Native decoded coverage proven by the published report, or null when
   * unavailable.
   */
  observed: {
    /** First frame intersecting the request, counted from zero. */
    firstFrame: number;
    /** Frame index just after the final frame intersecting the request. */
    endFrame: number;
    /** Total verified output frames, to clip adjacent context at EOF. */
    frameCount: number;
    /** Native inclusive presentation timestamp of the first frame. */
    start: IAutoMovieDeliveryContentAudit.ITimestamp;
    /** Native exclusive end of the final frame. */
    end: IAutoMovieDeliveryContentAudit.ITimestamp;
  } | null;
  /** A reason when native coverage could not be established. */
  unavailable: string | null;
  /** The single source occurrence or why it could not be assigned. */
  cut:
    | { state: "resolved"; entry: number; shot: string }
    | { state: "ambiguous" | "unavailable"; reason: string };
  /** Production-relative receipt of the earlier mark when explicitly rebound. */
  previous: string | null;
}
