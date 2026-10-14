import type { HumanViewerLane } from "./HumanViewerLane.js";
import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus.js";

/**
 * Estimate the priority line at admission by adding the running request and waiting requests in higher or equal lanes. This count does not include the scheduler's current UI streak: its patience rule can start a waiting CLI request before a new UI request. Later arrivals and bulk quiet time also affect actual starts, so this is not an exact execution position or wait duration.
 *
 * @evidence contracts/common.md#principled-implementation Current equal/higher-priority waiting counts plus one running request determine a priority-count estimate; patience, future arrivals and bulk quiet time remain the scheduler's actual ordering authority.
 * @evidence contracts/common.md#clear-and-simple-design A three-way lane expression mirrors queue ordering without rescheduling any request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The estimate omits current UI streak and cannot promise exact start position or duration; CLI patience and later arrivals can move work ahead without changing this recorded count.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies UI/CLI/bulk ordering and the limits of a snapshot queue position.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed lane counts and one running flag require constant-time arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each result uses the supplied current queue snapshot; prior positions are not reused as live admission state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No request task, queue entry or abort listener is acquired by this stateless estimate.
 */
export function humanViewerQueuePosition(
  status: IHumanViewerQueueStatus,
  lane: HumanViewerLane,
): number {
  const ahead: number =
    lane === "ui"
      ? status.waiting.ui
      : lane === "cli"
        ? status.waiting.ui + status.waiting.cli
        : status.waiting.ui + status.waiting.cli + status.waiting.bulk;
  return ahead + (status.running === null ? 0 : 1);
}
