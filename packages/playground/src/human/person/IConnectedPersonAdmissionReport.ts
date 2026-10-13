import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * The mounted admission report: the panel hands it the report of whatever is
 * on screen after every state change.
 *
 * @author Samchon
 */
export interface IConnectedPersonAdmissionReport {
  /** Draw the report of the displayed person, or state that nothing is displayed. */
  show(view: IConnectedPersonAdmissionView | null): void;
}
