import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";

/**
 * How one admission request ended: with the owner's verdict, or without one
 * (no loaded frame, or the request could not run), in which case the state
 * is pending with the reason the document waits.
 *
 * @evidence contracts/common.md#principled-implementation Only an owner's answer is marked as a verdict.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#clear-and-simple-design The verdict flag separates an actual owner judgement from a pending transport outcome in the same envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing frame or failed request retains pending status instead of posing as a numerical rejection.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Only an owner's answer is marked as a verdict.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant A missing frame or failed request retains pending status instead of posing as a numerical rejection.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionOutcome {
  /**
   * True when the owner judged the document.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority States whether a domain owner actually judged the request instead of classifying missing transport as a verdict.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant States whether a domain owner actually judged the request instead of classifying missing transport as a verdict.
   */
  verdict: boolean;

  /**
   * The verdict, or the pending state with its reason.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Carries the original judgement or the pending state with its infrastructure waiting cause.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Carries the original judgement or the pending state with its infrastructure waiting cause.
   */
  admission: IHumanViewerAdmission;
}
