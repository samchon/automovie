import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";

/**
 * The startup step `/health` reports and the operation that advances it.
 *
 * @author Samchon
 */
export interface IHumanViewerStartupPhase {
  /** The current step and when it began. */
  startup: IHumanViewerStartup;

  /** Enter the named step and log it. */
  phase: (name: string) => void;
}
