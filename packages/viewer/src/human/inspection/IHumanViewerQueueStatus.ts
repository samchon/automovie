import type { HumanViewerLane } from "./HumanViewerLane.js";

/**
 * What the server reports about its request queue.  Waiting, running and last-settled facts contribute local queue observation. They are independent of a whole production plan, wait-relation graph or completed-frame acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Projects actual per-lane waiting counts, unsettled running label/duration and last-settled result from the existing GPU queue.
 * @evidence contracts/common.md#clear-and-simple-design Keeps local queue observation distinct from production wait graphs, global work plans and frame acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rejected running requester can still occupy the slot until actual settlement; failed includes cancelled results and does not certify domain refusal.
 * @evidence contracts/common.md#meaningful-documentation Documents null idle/before-first states and shared-clock durations, without ETA or age-based cancellation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Status reads three array lengths and fixed running/last fields; scheduling/actual page work remain separate.
 * @evidence contracts/performance.md#reuse-equivalent-work Current task records are reused for reporting only; each status refreshes current time and populations rather than caching by label.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Waiting is bounded per lane and one actual task may remain unsettled; status returns no ownership transfer or history beyond last completion.
 *
 * @author Samchon
 */
export interface IHumanViewerQueueStatus {
  /** Requests accepted and not yet started, per lane. */
  waiting: Record<HumanViewerLane, number>;

  /** The label of the request the GPU page is working on, or null when idle. */
  running: string | null;

  /** Milliseconds the running request has been going. */
  runningMs: number | null;

  /**
   * The last request that finished, with its duration, or null before the first.
   */
  last: { label: string; ms: number; failed: boolean } | null;
}
