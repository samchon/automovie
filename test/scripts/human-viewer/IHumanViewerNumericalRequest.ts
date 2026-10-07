import type { IHumanViewerNumericalInput } from "./IHumanViewerNumericalInput";

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
 * @author Samchon
 */
export interface IHumanViewerNumericalRequest {
  /** Correlates the worker's answer with the page's pending request. */
  id: number;

  /** Which product runtime evaluates the document. */
  domain: "face" | "body" | "person";

  /** The basis token naming the file and its digest. */
  basis: string;

  /** The product runtime input. */
  input: IHumanViewerNumericalInput;

  /** Optional preview persistence authority, captured from the current catalogue and frame. */
  cache?: Pick<import("./IHumanViewerPersistenceJob").IHumanViewerPersistenceJob, "key" | "token">;
}
