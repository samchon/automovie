import type { IHumanViewerNumericalInput } from "./IHumanViewerNumericalInput.js";

/**
 * One preview request from the resident page to the numerical worker.
 *
 * `basis` names the file the runtime is built from, always with its digest:
 * `published@<d12>` is the domain's published basis (`published@<face12>.<body12>`
 * for a person on the two published bases), `published-generation@<head12>.<body12>`
 * the published one-skin generation's head and body files,
 * `published-generation-body@<body12>` a body document on that generation's
 * body view file, `candidate-generation:<name>@<head12>.<body12>` an input's
 * separate typed head/body views, and any other
 * `<name>@<digest12>` a candidate dropped beside a hand-written document (for a
 * person, one packet: a face/body basis pair or a one-skin source generation).
 *
 * @evidence contracts/common.md#principled-implementation The worker needs the request id, the domain runtime, the candidate source and the runtime input, nothing else.
 * @evidence contracts/common.md#meaningful-documentation States the candidate naming and what a person candidate holds.
 *
 * @evidence contracts/common.md#clear-and-simple-design Request id, domain, basis token and original input are the numerical request boundary; optional cache authority travels separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The domain dispatches to the existing product runtime and the basis token retains digest authority rather than a subject-specific override.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority The worker needs the request id, the domain runtime, the candidate source and the runtime input, nothing else.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The domain dispatches to the existing product runtime and the basis token retains digest authority rather than a subject-specific override.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalRequest {
  /**
   * Correlates the worker's answer with the page's pending request.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Correlates the request and its original numerical reply within this owned session.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Correlates the request and its original numerical reply within this owned session.
   */
  id: number;

  /**
   * Which product runtime evaluates the document.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Selects the existing Face, Body or Person runtime that owns document admission.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Selects the existing Face, Body or Person runtime that owns document admission.
   */
  domain: "face" | "body" | "person";

  /**
   * The basis token naming the file and its digest.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Retains exact digest-bearing basis authority consumed and verified by the selected numerical runtime.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Retains exact digest-bearing basis authority consumed and verified by the selected numerical runtime.
   */
  basis: string;

  /**
   * The product runtime input.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Forwards original document text and explicit operation without changing product input semantics.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Forwards original document text and explicit operation without changing product input semantics.
   */
  input: IHumanViewerNumericalInput;

  /**
   * Optional preview persistence authority, captured from the current catalogue and frame.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Captures optional original catalogue/frame persistence authority instead of rereading a later generation's token.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Captures optional original catalogue/frame persistence authority instead of rereading a later generation's token.
   */
  cache?: Pick<
    import("./IHumanViewerPersistenceJob.js").IHumanViewerPersistenceJob,
    "key" | "token"
  >;
}
