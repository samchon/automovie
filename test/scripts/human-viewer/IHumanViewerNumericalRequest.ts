import type { IHumanViewerNumericalInput } from "./IHumanViewerNumericalInput";

/**
 * One preview request from the resident page to the numerical worker.
 *
 * `basis` names a candidate dropped beside a hand-written document
 * (`<name>@<digest>`); omission selects the published basis of the domain. A
 * person candidate is one packet: either a face/body basis pair or a one-skin
 * source generation.
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

  /** Candidate source name, or omitted for the published basis. */
  basis?: string;

  /** The product runtime input. */
  input: IHumanViewerNumericalInput;
}
