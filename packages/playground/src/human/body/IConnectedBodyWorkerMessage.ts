import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";

/**
 * One request the body editor posts to a body-protocol worker. The numeric identity is transport correlation, while `input` retains the numerical runtime's closed operation union. Source loading and request admission belong to that runtime.
 *
 * @evidence contracts/common.md#principled-implementation A correlation envelope carries the existing closed body-request union unchanged, allowing the transport to pair replies without duplicating numerical operation definitions.
 * @evidence contracts/common.md#clear-and-simple-design Transport identity and numerical input occupy separate fields so protocol bookkeeping stays independent of body operation semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The payload uses the Human runtime's declared request type rather than a fixture-specific operation or an expected result sent as input.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes transport correlation from numerical operation selection and assigns source loading and admission to the runtime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This worker envelope implements no dispatch, source loading or numerical algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlation identity distinguishes requests but establishes no equivalent-input key or reusable result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Request data acquires no worker or transferable handle; the body port owns queued-envelope lifetime.
 *
 * @author Samchon
 */
export interface IConnectedBodyWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request. */
  input: ConnectedBodyRequest;
}
