import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Node HTTP middleware accepted by the viewer's Vite host. Keeping the wire
 * callback independent of server construction lets both CommonJS script
 * consumers and the ES-module host share its type without loading Vite config.
 *
 * @evidence contracts/common.md#clear-and-simple-design The request callback belongs to the HTTP boundary, independently of the host's module loader.
 *
 * @evidence contracts/common.md#principled-implementation The callback preserves Node request, response and next semantics at the supported HTTP middleware boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The borrowed request and response are passed through the host's middleware protocol without altering Vite methods.
 * @evidence contracts/common.md#meaningful-documentation The callback is an HTTP adapter type independent of Vite construction and module-loading side effects.
 *
 * @author Samchon
 */
export type HumanViewerMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: (error?: unknown) => void,
) => void;
