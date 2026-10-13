import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply.js";
import type { IHumanViewerPageState } from "./IHumanViewerPageState.js";

/**
 * How the server reaches the page's document admission and whom it tells
 * when a verdict arrives.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies page access and catalogue republication; the owner keeps only verdicts.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 *
 * @evidence contracts/common.md#principled-implementation Live page availability and asynchronous domain admission preserve unavailable transport separately from the owner's document verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The host supplies admission to the actual loaded frame; the server cannot invent its own schema verdict.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Live page availability and asynchronous domain admission preserve unavailable transport separately from the owner's document verdict.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The host supplies admission to the actual loaded frame; the server cannot invent its own schema verdict.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerAdmissionProps {
  /**
   * Whether the page can admit documents now, will be able to, or never can.
   *
   * @evidence contracts/common.md#principled-implementation Current page availability is read before deciding whether document admission can run.
   * @evidence contracts/common.md#clear-and-simple-design The admission owner borrows residency state instead of maintaining a second browser state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed or starting page cannot be assumed to have returned a document verdict.
   * @evidence contracts/common.md#meaningful-documentation Ready, starting and failed availability retain the page owner's reason.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Current page availability is read before deciding whether document admission can run.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Ready, starting and failed availability retain the page owner's reason.
   */
  page: () => IHumanViewerPageState;

  /**
   * Asks the page's admission bridge to judge one document JSON.
   *
   * @evidence contracts/common.md#principled-implementation Domain, original document JSON and basis identity are sent to the loaded frame's admission owner.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous callback returns the existing bridge outcome.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The server delegates the schema judgement rather than manufacturing acceptance.
   * @evidence contracts/common.md#meaningful-documentation The reply separates unavailable transport from an owner verdict and frame token.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Domain, original document JSON and basis identity are sent to the loaded frame's admission owner.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The reply separates unavailable transport from an owner verdict and frame token.
   */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;

  /**
   * Called after a verdict or a waiting reason was stored, so the host republishes its catalogue.
   *
   * @evidence contracts/common.md#principled-implementation Publication is requested after the admission owner stores a verdict or waiting cause.
   * @evidence contracts/common.md#clear-and-simple-design The callback lets the host republish without giving catalogue ownership to admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A waiting outcome is published as waiting rather than silently changed into a verdict.
   * @evidence contracts/common.md#meaningful-documentation The notification follows stored state and carries no synthetic judgement.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Publication is requested after the admission owner stores a verdict or waiting cause.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The notification follows stored state and carries no synthetic judgement.
   */
  changed: () => void;
}
