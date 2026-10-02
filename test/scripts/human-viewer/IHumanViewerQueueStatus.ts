import type { HumanViewerLane } from "./HumanViewerLane";
/** What the server reports about its request queue. */
export interface IHumanViewerQueueStatus {
  /** Requests accepted and not yet started, per lane. */
  waiting: Record<HumanViewerLane, number>;

  /** The label of the request the GPU page is working on, or null when idle. */
  running: string | null;

  /** Milliseconds the running request has been going. */
  runningMs: number | null;

  /** The last request that finished, with its duration, or null before the first. */
  last: { label: string; ms: number; failed: boolean } | null;
}
