import type { IncomingMessage, ServerResponse } from "node:http";

import type { createHumanViewerNodeService } from "./createHumanViewerNodeService.js";

/**
 * Request bindings for the existing typed numerical protocol over loopback HTTP.
 *
 * @evidence contracts/common.md#principled-implementation Loopback numerical routes bind original typed requests and event streams to the existing Node service's owned sessions and source authority.
 * @evidence contracts/common.md#clear-and-simple-design One service dependency owns evaluation, persistence correlation and cancellation; the HTTP adapter translates transport only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical refusals and rejected construction reports are preserved rather than rewritten into successful previews.
 * @evidence contracts/common.md#meaningful-documentation Comments identify route selection, original message transport, owned event streams and the service's numerical/source responsibilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Request bindings choose no lossless-codec parsing or numerical evaluation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Session-bound protocol effects cannot be shared merely because request documents or route paths match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The service owns sessions and event streams; stream closure or session deletion requests child retirement, whose refusal retains unknown ownership and does not prove computation ended while the HTTP server owns response handles.
 *
 * @author Samchon
 */
export interface IServeHumanViewerNumericalProps {
  /** Parsed request URL selecting the numerical session or event route. */
  url: URL;

  /** Original incoming HTTP request carrying the typed protocol message. */
  request: IncomingMessage;

  /** Response or owned event stream returned for this numerical request. */
  response: ServerResponse;

  /**
   * Existing numerical service owning typed sessions, evaluation and source authority.
   */
  service: ReturnType<typeof createHumanViewerNodeService>;
}
