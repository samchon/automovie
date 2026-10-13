/**
 * What a starting server is doing, as `/health` reports it. The phase stays `ready` once the first source generation can draw.
 *
 * @author Samchon
 */
export interface IHumanViewerStartup {
  /** The current startup step. */
  phase: string;

  /** ISO time the step began. */
  since: string;
}
