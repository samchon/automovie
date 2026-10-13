import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";

/**
 * How one admission request ended: with the owner's verdict, or without one
 * (no loaded frame, or the request could not run), in which case the state
 * is pending with the reason the document waits.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionOutcome {
  /** True when the owner judged the document. */
  verdict: boolean;

  /** The verdict, or the pending state with its reason. */
  admission: IHumanViewerAdmission;
}
