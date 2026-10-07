import type { IHumanViewerStartup } from "./IHumanViewerStartup";

/**
 * The startup step `/health` reports and the operation that advances it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 * @author Samchon
 */
export interface IHumanViewerStartupPhase {
  /** The current step and when it began. */
  startup: IHumanViewerStartup;

  /** Enter the named step and log it. */
  phase: (name: string) => void;
}
