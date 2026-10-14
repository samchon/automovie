import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand.js";

/**
 * Owned message endpoint behind the product numerical port; no foreign Worker is patched.
 *
 * @evidence contracts/common.md#principled-implementation Exposes one owned checked Node session through NDJSON/devalue messages and posts, preserving source-change failure identity.
 * @evidence contracts/common.md#clear-and-simple-design Keeps message/error subscribers separate from post and terminal retirement without patching a foreign Worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retirement aborts transport and requests best-effort session DELETE; a void return is not physical child-exit proof.
 * @evidence contracts/common.md#meaningful-documentation Documents nullable subscribers, later-post refusal and repeated terminal behavior, distinguishing explicit disposal from execution failure notification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no transport; its producer decodes chunks/lines and correlates readiness with its opened session.
 * @evidence contracts/performance.md#reuse-equivalent-work Concurrent posts share readiness only within this endpoint; equal request text does not merge effects or authorize a replacement source realm.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One stream/session is owned while live, pending lines/posts are uncapped and reader lock releases at settlement; DELETE completion does not prove child exit.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalEndpoint {
  /**
   * Current message subscriber, or null while none is installed; receives original numerical transport envelopes.
   */
  onmessage:
    | ((event: MessageEvent<HumanViewerNumericalMessage>) => void)
    | null;

  /**
   * Current execution-failure subscriber, or null while none is installed; explicit disposal does not report a new failure.
   */
  onerror: ((event: ErrorEvent) => void) | null;

  /**
   * Post an original numerical request or persistence command to this owned session; a retired endpoint refuses later posts.
   *
   * @evidence contracts/common.md#principled-implementation Posts the original numerical or persistence envelope to this endpoint's checked opened session after shared readiness.
   * @evidence contracts/common.md#clear-and-simple-design Keeps server transport separate from product schema/build operations and persistence ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Terminal state refuses later posts; rejected HTTP/source-change response becomes execution failure rather than successful delivery or replay.
   * @evidence contracts/common.md#meaningful-documentation The void method schedules asynchronous delivery and errors reach onerror; callers still correlate actual model/admission replies separately.
   * @evidence contracts/performance.md#efficient-algorithms Envelope encoding/HTTP bytes scale with request size; concurrent posts have no independent numeric cap in the endpoint.
   * @evidence contracts/performance.md#reuse-equivalent-work Readiness is shared for one session while messages remain separate effects; terminal/source failure never reuses old work on a new realm.
   * @evidence contracts/performance.md#bound-retention-and-release-resources AbortController owns pending fetches until settlement and session DELETE is best effort; post returns no native process ownership.
   */
  postMessage: (
    message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand,
  ) => void;

  /**
   * Mark this endpoint terminal, abort its transport and request best-effort session DELETE. Repeated calls have no additional effect; the void return does not prove native child exit.
   *
   * @evidence contracts/common.md#principled-implementation Marks the endpoint terminal, rejects readiness, aborts owned transport and requests retirement of its announced session.
   * @evidence contracts/common.md#clear-and-simple-design Uses the same release path as execution failure while explicit disposal omits a new error notification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated calls have no new effect, but a void best-effort DELETE request cannot prove process termination or successful physical cleanup.
   * @evidence contracts/common.md#meaningful-documentation Later posts refuse with the retained terminal cause; disposal withdraws this endpoint without replaying pending product requests.
   * @evidence contracts/performance.md#efficient-algorithms Terminal bookkeeping is fixed work and abort/DELETE effects belong to the actual browser/server transport.
   * @evidence contracts/performance.md#reuse-equivalent-work All callers see the same terminal state rather than repeating retirement or acquiring a replacement within this endpoint.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The event reader releases its lock on settlement; session/native child closure is server-owned and failed DELETE has no awaitable completion here.
   */
  terminate: () => void;
}
