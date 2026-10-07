/**
 * What a starting server is doing, as `/health` reports it. The phase stays
 * `ready` once the first source generation can draw.
 *
 * @evidence contracts/common.md#principled-implementation Reports the actual startup step instead of a bare not-ready flag.
 * @evidence contracts/common.md#meaningful-documentation Names the phase and when it began.
 * @author Samchon
 */
export interface IHumanViewerStartup {
  /** The current startup step. */
  phase: string;

  /** ISO time the step began. */
  since: string;
}
