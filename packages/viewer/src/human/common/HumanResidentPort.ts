import type { HumanResidentReply } from "./HumanResidentReply.js";
import type { IHumanResidentRequest } from "./IHumanResidentRequest.js";
import type { IHumanWorkerError } from "./IHumanWorkerError.js";
import type { IHumanWorkerMessage } from "./IHumanWorkerMessage.js";

/**
 * Numerical protocol connection supplied by a viewport factory. It may wrap a native browser worker or a checked Node session port. createHumanResidentWorker lazily acquires one connection, correlates replies and invokes its termination on failure/disposal; allocation policy stays with the supplied factory.
 *
 * @evidence contracts/common.md#principled-implementation Typed request/reply envelopes and normalized failure callbacks let the numerical coordinator correlate independently issued requests; producer protocol validity remains its premise.
 * @evidence contracts/common.md#clear-and-simple-design The small transport port keeps native/Node allocation outside numerical correlation and viewport publication without patching a foreign Worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation withdraws result authority rather than pretending to stop computation; a void terminate is not an independently observed physical process exit.
 * @evidence contracts/common.md#meaningful-documentation Documents nullable subscribers, actual connection acquisition/termination ownership and native versus checked-session transport support.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no dispatch; its coordinator uses map correlation and transport implementations own encoding/build costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One acquired connection can serve successful edits, while requests keep separate ids; failed termination blocks fresh allocation and preserves its cause.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The coordinator retains at most one live/failed port plus uncapped pending callbacks; replies/cancellation/closure withdraw requests, while the supplied port owns its native termination behavior.
 *
 * @author Samchon
 */
export interface HumanResidentPort<Input, Output> {
  /** Current correlated response callback; null detaches the consumer. */
  onmessage:
    | ((event: IHumanWorkerMessage<HumanResidentReply<Output>>) => void)
    | null;

  /** A normalized transport failure invalidates requests of this connection. */
  onerror: ((event: IHumanWorkerError) => void) | null;

  /**
   * Send one correlated numerical request; typed input alone does not establish runtime schema admission.
   *
   * @evidence contracts/common.md#principled-implementation Dispatches the coordinator's original id/input envelope to its actual transport implementation.
   * @evidence contracts/common.md#clear-and-simple-design Product domain operation grammar remains with the input/runtime, separate from transport and reply correlation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sending is not successful construction or physical completion; thrown transport failure must settle current pending requests with its cause.
   * @evidence contracts/common.md#meaningful-documentation Defines original request identity/input and separate later message/error settlement rather than guaranteeing synchronous success.
   * @evidence contracts/performance.md#efficient-algorithms Transport serialization/copy and runtime evaluation costs follow input/output bytes and geometry, beyond fixed id dispatch.
   * @evidence contracts/performance.md#reuse-equivalent-work Connection reuse does not merge equal-input effects; every request retains its own correlation and cancellation authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Pending callbacks remain until reply/cancel/failure, without a numeric request cap; this method transfers no port ownership.
   */
  postMessage: (request: IHumanResidentRequest<Input>) => void;

  /**
   * Retire this connection on transport failure or owner disposal. Throws must preserve failed ownership; a void result is not a native-process census.
   *
   * @evidence contracts/common.md#principled-implementation The numerical coordinator invokes the supplied native/virtual connection terminator after withdrawing reply authority.
   * @evidence contracts/common.md#clear-and-simple-design One producer-owned termination boundary keeps browser-worker or shared-session details outside request maps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A thrown terminator retains the actual failed port/cause and prevents reconnection; logical withdrawal is not certified physical release.
   * @evidence contracts/common.md#meaningful-documentation States failure/disposal purpose, thrown ownership retention and the void completion limit for asynchronous virtual transports.
   * @evidence contracts/performance.md#efficient-algorithms Native retirement cost belongs to the port implementation; the coordinator separately visits its pending callbacks once.
   * @evidence contracts/performance.md#reuse-equivalent-work Failed retirement is sticky and not retried through a fresh allocation; supported virtual ports may withdraw only this logical connection while a shared realm remains.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied factory/transport defines actual native lifetime, and the coordinator keeps a failed port reachable until its owner ends rather than multiplying connections.
   */
  terminate: () => void;
}
