import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Node HTTP middleware accepted by the viewer's Vite host. Keeping the wire
 * callback independent of server construction lets both CommonJS script
 * consumers and the ES-module host share its type without loading Vite config.
 *
 * @evidence contracts/common.md#clear-and-simple-design The request callback belongs to the HTTP boundary, independently of the host's module loader.
 * @author Samchon
 */
export type HumanViewerMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: (error?: unknown) => void,
) => void;
