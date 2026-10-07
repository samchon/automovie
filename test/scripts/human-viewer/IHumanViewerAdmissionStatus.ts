/**
 * Admission work the server is doing or waiting on, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation Documents awaiting a frame are reported by name of their reason, so a bridge that never arrives is visible.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerAdmissionStatus {
  /** Admissions asked of the page and not yet answered. */
  asking: number;

  /** Documents whose admission could not run, held pending until a frame announces itself. */
  waiting: number;

  /** The distinct reasons those documents wait for. */
  reasons: string[];
}
