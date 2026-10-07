import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * The mounted admission report: the panel hands it the report of whatever is
 * on screen after every state change.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Redraws the displayed person's admission report whenever the displayed person changes.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Receives the report as derived state and holds none of its own.
 * @author Samchon
 */
export interface IConnectedPersonAdmissionReport {
  /** Draw the report of the displayed person, or state that nothing is displayed. */
  show(view: IConnectedPersonAdmissionView | null): void;
}
