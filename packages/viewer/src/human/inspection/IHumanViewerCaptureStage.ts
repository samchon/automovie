/**
 * The stage the running capture is in, as `/health` reports it.
 *
 * Stage identity and observation timestamps locate local capture work. They supply no remaining-work estimate, lease heartbeat or age-based cancellation authority.
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
