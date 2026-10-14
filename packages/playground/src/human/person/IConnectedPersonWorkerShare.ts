import type { ConnectedPersonWorkerEnd } from "./ConnectedPersonWorkerEnd";

/**
 * The two ends of the one resident person worker: the preview transport's and
 * the measurement transport's. Each call returns the end of the live worker,
 * starting a new worker when none is alive.
 * Terminating either end closes the shared physical worker and reports retirement to its peer; neither end is independent physical ownership. The enclosing preview/measurement transports close their own pending requests and listeners.
 *
 * @evidence contracts/common.md#principled-implementation Separate preview and measurement endpoints route their own protocols over one resident generation while either-end retirement notifies the peer and later acquisition opens a fresh worker.
 * @evidence contracts/common.md#clear-and-simple-design The share exposes only the existing native-shaped transport ends, leaving pending request correlation to each transport and physical worker lifetime to the share.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Logical endpoints are not independent workers, a peer cannot remain falsely live after shared retirement and no second generation copy is loaded merely for measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies shared physical lifetime, protocol roles, fresh acquisition and separate transport request/listener owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface implements no worker acquisition or reply dispatch algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Actual resident generation sharing is implemented by the share owner rather than these endpoint signatures.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no native worker or response listener; physical and logical lifetimes belong to their implementations.
 *
 * @author Samchon
 */
export interface IConnectedPersonWorkerShare {
  /**
   * Acquire the current preview/construction/export end, opening one shared worker when none is live.
   *
   * @evidence contracts/common.md#principled-implementation Preview operations receive the endpoint for the same live generation used by measurement requests.
   * @evidence contracts/common.md#clear-and-simple-design Native-shaped acquisition keeps existing resident preview transport independent of reply sharing internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reacquisition after retirement returns a fresh physical worker end rather than reviving a closed endpoint.
   * @evidence contracts/common.md#meaningful-documentation The member specifies protocol scope, current acquisition and shared worker creation on absence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The acquisition signature chooses no worker launch or listener registration strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared resident connection reuse belongs to the implementing share owner, not this method declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Physical worker ownership remains shared and preview pending requests belong to its transport.
   */
  preview(): ConnectedPersonWorkerEnd;

  /**
   * Acquire the current measurement end of the same shared worker, opening it when none is live.
   *
   * @evidence contracts/common.md#principled-implementation Measurement requests evaluate the same resident head/body generation as preview instead of loading an independent copy.
   * @evidence contracts/common.md#clear-and-simple-design This endpoint seam preserves the existing numerical measurement transport and hides resident reply routing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical retirement by either endpoint refuses this peer, and later acquisition does not pretend the old generation is still live.
   * @evidence contracts/common.md#meaningful-documentation The member states measurement role, shared generation and reopen-on-absence behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature implements no generation loading, launch or reply routing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Generation sharing is an implementation lifetime choice rather than a cached numerical result promised by this type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The share owns the physical worker and measurement transport owns its logical listener/request lifecycle.
   */
  measure(): ConnectedPersonWorkerEnd;
}
