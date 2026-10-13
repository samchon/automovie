/**
 * The stage the running capture is in, as `/health` reports it.
 *
 * Stage identity and observation timestamps locate local capture work. They supply no remaining-work estimate, lease heartbeat or age-based cancellation authority.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Stage and document identity accompany actual start and last-progress times for capture observation.
 * @evidence contracts/common.md#clear-and-simple-design One current-stage record is sufficient for room preparation, page drawing and trim telemetry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress timestamps describe observations and confer no permission to cancel a valid capture by age.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Stage and document identity accompany actual start and last-progress times for capture observation.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Progress timestamps describe observations and confer no permission to cancel a valid capture by age.
 *
 * @author Samchon
 */
export interface IHumanViewerCaptureStage {
  /**
   * `room`, `page` (show and PNG in the page) or `trim`.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Names the actual room, page or trim boundary currently observed during capture.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Names the actual room, page or trim boundary currently observed during capture.
   */
  name: string;

  /**
   * The document being captured.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Identifies the selected document whose capture work produced the stage observation.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Identifies the selected document whose capture work produced the stage observation.
   */
  doc: string;

  /**
   * ISO time the stage began.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Records the stage's actual start time without making age an interruption permission.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Records the stage's actual start time without making age an interruption permission.
   */
  since: string;

  /**
   * ISO time the stage last showed progress.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Records the latest actual progress observation without pretending it proves a finished GPU frame.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Records the latest actual progress observation without pretending it proves a finished GPU frame.
   */
  progress: string;
}
