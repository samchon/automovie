/**
 * Admission work the server is doing or waiting on, as `/health` reports it.
 *
 * Counts and waiting causes come from the admission owner. A pending transport is distinct from a numerical verdict and does not establish whole-job progress or recovery policy.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionStatus {
  /** Admissions asked of the page and not yet answered. */
  asking: number;

  /**
   * Documents whose admission could not run, held pending until a frame announces itself.
   */
  waiting: number;

  /** The distinct reasons those documents wait for. */
  reasons: string[];
}
