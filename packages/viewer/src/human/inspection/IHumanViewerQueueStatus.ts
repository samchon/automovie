import type { HumanViewerLane } from "./HumanViewerLane.js";

/**
 * What the server reports about its request queue.
 *
 * Waiting, running and last-settled facts contribute local queue observation. They are independent of a whole production plan, wait-relation graph or completed-frame acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Per-lane waiting counts and nullable active and completed request readings preserve distinct queue states.
 * @evidence contracts/common.md#clear-and-simple-design One status record reports current work and the latest completion without exposing queue nodes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duration reports actual running work and never authorizes cancelling a task merely by its age.
 * @evidence contracts/common.md#meaningful-documentation Null running and last values mean idle and no previous completion, while all durations are milliseconds.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Per-lane waiting counts and nullable active and completed request readings preserve distinct queue states.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Duration reports actual running work and never authorizes cancelling a task merely by its age.
 *
 * @author Samchon
 */
export interface IHumanViewerQueueStatus {
  /**
   * Requests accepted and not yet started, per lane.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports actual accepted-but-not-started request counts for each declared scheduling lane.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports actual accepted-but-not-started request counts for each declared scheduling lane.
   */
  waiting: Record<HumanViewerLane, number>;

  /**
   * The label of the request the GPU page is working on, or null when idle.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Keeps the active request label nullable while the queue is idle.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Keeps the active request label nullable while the queue is idle.
   */
  running: string | null;

  /**
   * Milliseconds the running request has been going.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports actual elapsed milliseconds for the active slot, remaining null when nothing runs.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports actual elapsed milliseconds for the active slot, remaining null when nothing runs.
   */
  runningMs: number | null;

  /**
   * The last request that finished, with its duration, or null before the first.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Preserves the latest physically settled task's label, duration and failure status independently of current queue work.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Preserves the latest physically settled task's label, duration and failure status independently of current queue work.
   */
  last: { label: string; ms: number; failed: boolean } | null;
}
