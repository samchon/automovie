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
 * @author Samchon
 */
export interface IHumanViewerCaptureStage {
  /** `room`, `page` (show and PNG in the page) or `trim`. */
  name: string;

  /** The document being captured. */
  doc: string;

  /** ISO time the stage began. */
  since: string;

  /** ISO time the stage last showed progress. */
  progress: string;
}
