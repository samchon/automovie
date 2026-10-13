/**
 * What a starting server is doing, as `/health` reports it. The phase stays `ready` once the first source generation can draw.
 *
 * @evidence contracts/common.md#principled-implementation Startup reporting records the named phase and its actual entry time independently from numerical or appearance acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One health record describes startup progress without embedding the startup orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A phase name and timestamp are progress facts and supply no elapsed-time shutdown condition.
 * @evidence contracts/common.md#meaningful-documentation Explains the startup step, ISO entry time and retention of the ready phase after initial display readiness.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Startup reporting records the named phase and its actual entry time independently from numerical or appearance acceptance.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One health record describes startup progress without embedding the startup orchestration.
 * @author Samchon
 */
export interface IHumanViewerStartup {
  /**
   * The current startup step.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The current startup step. Startup reporting records the named phase and its actual entry time independently from numerical or appearance acceptance.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The current startup step. One health record describes startup progress without embedding the startup orchestration.
   */
  phase: string;

  /**
   * ISO time the step began.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation ISO time the step began. Startup reporting records the named phase and its actual entry time independently from numerical or appearance acceptance.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform ISO time the step began. One health record describes startup progress without embedding the startup orchestration.
   */
  since: string;
}
