import type { IncomingMessage, ServerResponse } from "node:http";
import type { createHumanViewerNodeService } from "./createHumanViewerNodeService.js";

/**
 * Request bindings for the existing typed numerical protocol over loopback HTTP.
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
