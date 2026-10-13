/**
 * What a starting server is doing, as `/health` reports it. The phase stays `ready` once the first source generation can draw.
 *
 * @evidence contracts/common.md#principled-implementation Startup reporting records the named phase and its actual entry time independently from numerical or appearance acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One health record describes startup progress without embedding the startup orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A phase name and timestamp are progress facts and supply no elapsed-time shutdown condition.
 * @evidence contracts/common.md#meaningful-documentation Explains the startup step, ISO entry time and retention of the ready phase after initial display readiness.
 * @author Samchon
 */
export interface IHumanViewerStartup {
  /** The current startup step. */
  phase: string;

  /** ISO time the step began. */
  since: string;
}
