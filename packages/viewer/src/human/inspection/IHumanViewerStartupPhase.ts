import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";

/**
 * The startup step `/health` reports and the operation that advances it.
 *
 * @evidence contracts/common.md#principled-implementation The phase reporter exposes current startup facts beside the explicit operation that records a transition.
 * @evidence contracts/common.md#clear-and-simple-design The host keeps startup state and logging behind one phase operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Entering a named startup step does not itself certify a hardware frame or cancel a slow prior step.
 * @evidence contracts/common.md#meaningful-documentation Documents the shared startup record and the operation that enters and logs a named phase.
 * @author Samchon
 */
export interface IHumanViewerStartupPhase {
  /** The current step and when it began. */
  startup: IHumanViewerStartup;

  /**
   * Enter the named step and log it.
   *
   * @evidence contracts/common.md#principled-implementation A named phase updates the startup owner's current step and records its transition.
   * @evidence contracts/common.md#clear-and-simple-design The phase owner retains startup logging while callers supply a phase name.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A progress transition does not establish successful numerical or hardware-render acceptance.
   * @evidence contracts/common.md#meaningful-documentation Explains the named-step entry and logging effect.
   */
  phase: (name: string) => void;
}
