import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";

/**
 * How one admission request ended: with the owner's verdict, or without one
 * (no loaded frame, or the request could not run), in which case the state
 * is pending with the reason the document waits.
 *
 * @evidence contracts/common.md#principled-implementation Only an owner's answer is marked as a verdict.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 * @author Samchon
 */
export interface IHumanViewerAdmissionOutcome {
  /** True when the owner judged the document. */
  verdict: boolean;

  /** The verdict, or the pending state with its reason. */
  admission: IHumanViewerAdmission;
}
