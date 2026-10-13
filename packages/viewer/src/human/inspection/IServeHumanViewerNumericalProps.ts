import type { IncomingMessage, ServerResponse } from "node:http";
import type { createHumanViewerNodeService } from "./createHumanViewerNodeService.js";

/**
 * Request bindings for the existing typed numerical protocol over loopback HTTP.
 *
 * @evidence contracts/common.md#principled-implementation The loopback numerical route passes the existing typed service protocol through one HTTP request/response binding.
 * @evidence contracts/common.md#clear-and-simple-design One service reference keeps computation and numerical-worker lifetime outside the HTTP transport record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The route's bindings declare no substitute model builder or untyped result-production path.
 * @evidence contracts/common.md#meaningful-documentation Defines the request URL, inbound/outbound transport and existing numerical service authority.
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
