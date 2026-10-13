import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand.js";

/**
 * Owned message endpoint behind the product numerical port; no foreign Worker is patched.
 *
 * @evidence contracts/common.md#principled-implementation Event callbacks and message posting express the existing product port over an owned numerical connection.
 * @evidence contracts/common.md#clear-and-simple-design One endpoint owns message delivery, execution error reporting, posting and retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The adapter implements this port without modifying a foreign Worker or injecting a browser evaluator.
 * @evidence contracts/common.md#meaningful-documentation Message and error callbacks are nullable until subscribed; termination retires the owned connection.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Event callbacks and message posting express the existing product port over an owned numerical connection.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The adapter implements this port without modifying a foreign Worker or injecting a browser evaluator.
 * @author Samchon
 */
export interface IHumanViewerNumericalEndpoint {
  /**
   * Current message subscriber, or null while none is installed; receives original numerical transport envelopes.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Delivers original numerical lifecycle and result envelopes to the current subscriber, remaining null before subscription.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Delivers original numerical lifecycle and result envelopes to the current subscriber, remaining null before subscription.
   */
  onmessage: ((event: MessageEvent<HumanViewerNumericalMessage>) => void) | null;

  /**
   * Current execution-failure subscriber, or null while none is installed; explicit disposal does not report a new failure.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Reports actual endpoint execution failure to the current subscriber without turning explicit disposal into a new failure.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Reports actual endpoint execution failure to the current subscriber without turning explicit disposal into a new failure.
   */
  onerror: ((event: ErrorEvent) => void) | null;

  /**
   * Post an original numerical request or persistence command to this owned session; a retired endpoint refuses later posts.
   *
   * @evidence contracts/common.md#principled-implementation Original numerical requests and persistence commands reach the owned Node event session.
   * @evidence contracts/common.md#clear-and-simple-design One posting operation carries the existing product protocol without a second model API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A retired endpoint refuses posting rather than creating a fallback browser evaluator.
   * @evidence contracts/common.md#meaningful-documentation Transport errors report through onerror, and terminal retirement makes later posts fail.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Original numerical requests and persistence commands reach the owned Node event session.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Transport errors report through onerror, and terminal retirement makes later posts fail.
   */
  postMessage: (message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand) => void;

  /**
   * Retire this endpoint and release its owned stream and numerical session; repeated calls have no additional effect.
   *
   * @evidence contracts/common.md#principled-implementation Explicit disposal retires the endpoint and releases its owned stream and session.
   * @evidence contracts/common.md#clear-and-simple-design The connection's single lifetime owner handles cancellation and release.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the owned endpoint is terminated; no foreign Worker method or process is altered.
   * @evidence contracts/common.md#meaningful-documentation Repeated termination has no new resource effect and explicit retirement does not report a new execution failure.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Explicit disposal retires the endpoint and releases its owned stream and session.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Repeated termination has no new resource effect and explicit retirement does not report a new execution failure.
   */
  terminate: () => void;
}
