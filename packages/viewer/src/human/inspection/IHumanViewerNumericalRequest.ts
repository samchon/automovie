import type { IHumanViewerNumericalInput } from "./IHumanViewerNumericalInput.js";

/**
 * One correlated preview, construction, export or admission request from the resident page to its checked numerical realm. The basis token names published, candidate-packet or paired-view byte authority, with displayed digest portions shortened to twelve hex characters. The source route checks the selected bytes before the numerical owner uses them.
 *
 * @evidence contracts/common.md#principled-implementation Binds one original domain operation/document to an actual basis token and optional preview persistence key/frame authority.
 * @evidence contracts/common.md#clear-and-simple-design Separates correlation, numerical input and cache-write authorization from host initialization and transport readiness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Basis tokens display truncated digest portions and are not collision-impossibility proof; routes check current owner bytes and domain admission remains separate.
 * @evidence contracts/common.md#meaningful-documentation Documents supported published/candidate packet/view tokens and optional cache authority; requests include admission/construction/export as well as preview.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no fetch/build; numerical source owners resolve basis bytes and product owners pay document/model costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Preview reuse requires equivalent selected JSON, basis/source key and AO mode; construct/export bypass preview cache and replies remain individually correlated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The transport retains requests until actual reply/retirement, with no count/byte cap enforced by this interface or native handle embedded.
 *
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

  /**
   * Optional preview persistence authority, captured from the current catalogue and frame.
   */
  cache?: Pick<
    import("./IHumanViewerPersistenceJob.js").IHumanViewerPersistenceJob,
    "key" | "token"
  >;
}
