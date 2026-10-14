import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";

/**
 * Preparation and reply transport for one resident numerical runtime. Each request awaits the same preparation result; its own error boundary retains the initiating correlation id even when preparation rejects.
 *
 * @evidence contracts/common.md#principled-implementation A shared evaluator-preparation promise and a typed correlated reply sink separate numerical readiness from each request's transport outcome.
 * @evidence contracts/common.md#clear-and-simple-design Two supplied services describe the entire handler boundary without exposing source loading, worker queues or renderer state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation rejection remains an actual request refusal rather than a fabricated neutral evaluator or fixture result.
 * @evidence contracts/common.md#meaningful-documentation The comment explains preparation sharing, request-local correlation and the evaluator's separate numerical input admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This dependency schema chooses no preparation, numerical evaluation or transport algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema supplies one shared promise but does not itself coordinate its evaluation or memoize numerical answers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Preparation and transport are borrowed services; this type acquires no worker or source handle.
 *
 * @author Samchon
 */
export interface IHumanResidentHandlerProps<Input, Output> {
  /**
   * Shared runtime preparation, which can reject; the resulting evaluator owns input admission, so runtime readiness alone does not accept a request. The provider owns source preparation and the handler reuses the same promise without caching evaluated answers.
   */
  prepare: Promise<(input: Input) => Promise<Output>>;

  /**
   * Publish the evaluated value or refusal under the original request id; synchronous transport failures can escape the handler if refusal delivery also fails.
   *
   * @evidence contracts/common.md#principled-implementation A discriminated reply carries either the numerical value or refusal with the initiating request identity.
   * @evidence contracts/common.md#clear-and-simple-design The sink owns native delivery while the handler assembles the protocol envelope.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reply transport does not replace a failed numerical answer or reassign it to a newer request.
   * @evidence contracts/common.md#meaningful-documentation The member states correlation and the synchronous send-failure limitation of refusal reporting.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reply-sink signature chooses no cloning or transferable-buffer delivery strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reply publication is an effect bound to one request and is not shared by matching values.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The native sink owns transport resources; this callback type transfers only reply data.
   */
  send: (reply: HumanResidentReply<Output>) => void;
}
