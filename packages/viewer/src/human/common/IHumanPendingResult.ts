/**
 * The settlement callbacks owned by one pending numerical request.
 *
 * @evidence contracts/common.md#principled-implementation Native promise resolve/reject callbacks settle one correlated request; createHumanResidentWorker removes its pending entry before delivering a reply and cancellation withdraws the same entry.
 * @evidence contracts/common.md#clear-and-simple-design A pair of callbacks stores the pending promise's authority without retaining its numerical input or another worker object in each map entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Settlement follows an actual reply, cancellation or transport failure, with no fixture outcomes or replacement of native promise methods.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish successful numerical delivery and Error refusal; the resident coordinator owns their pending lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Each entry is constant-size callback bookkeeping; reply lookup/removal uses a map keyed by request id instead of scanning all pending promises.
 * @evidence contracts/performance.md#reuse-equivalent-work One callback pair belongs to one request. Native promises ignore later settlements, while the coordinator also removes authority to avoid interpreting stale replies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pending map retains these closures until reply, cancellation, transport failure or disposal. Unsettled concurrent requests have no imposed population cap; the entry itself owns no native resource.
 *
 * @author Samchon
 */
export interface IHumanPendingResult<Output> {
  /**
   * Resolve this request with its numerical value; does not publish a GPU frame.
   *
   * @evidence contracts/common.md#principled-implementation The callback is the native promise resolver for Output; settlement transfers the numerical value to the awaiting consumer, which still owns any later admission or frame preparation.
   * @evidence contracts/common.md#clear-and-simple-design The successful branch is one callback rather than another numerical transport layer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No success value is computed here, and promise resolution is not treated as observed GPU publication.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes promise resolution from rendering and identifies the request's value delivery.
   * @evidence contracts/performance.md#efficient-algorithms Calling the resolver is constant coordinator work; any promise assimilation and consumer processing belong to the native promise and consumer.
   * @evidence contracts/performance.md#reuse-equivalent-work A native promise settles once. The coordinator deletes its entry before resolution instead of retaining a reusable successful callback by document identity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Pending entry removal releases coordinator references to the resolver; the resolved promise can retain Output for as long as its consumer retains that promise.
   */
  resolve: (value: Output) => void;

  /**
   * Reject this request with its numerical, cancellation or transport failure.
   *
   * @evidence contracts/common.md#principled-implementation The native promise rejector preserves the Error passed by its request owner; no candidate numerical output is admitted on this branch.
   * @evidence contracts/common.md#clear-and-simple-design One rejection callback handles reply refusal, explicit cancellation and connection closure without another error queue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal keeps its actual cause and does not turn cancellation into a successful empty model.
   * @evidence contracts/common.md#meaningful-documentation The comment includes cancellation as well as numerical and transport failure, matching actual coordinator callers.
   * @evidence contracts/performance.md#efficient-algorithms Calling this resolver is constant work; rejecting all entries after connection failure is a separate linear coordinator traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Native rejection completes one promise once. Different requests remain independently rejected even when a shared transport Error is delivered to all of them.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Entry deletion or map clearing releases pending callback retention; the rejected promise and its consumer may still retain the Error until unreachable.
   */
  reject: (error: Error) => void;
}
