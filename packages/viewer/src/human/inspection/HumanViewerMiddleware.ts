import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Node HTTP middleware accepted by the viewer's Vite host. Keeping the wire
 * callback independent of server construction lets both CommonJS script
 * consumers and the ES-module host share its type without loading Vite config.
 *
 *
 * @evidence contracts/common.md#principled-implementation The standard Node request/response/next callback shape is consumed by the playground Vite host and created by createHumanViewerMiddleware; next forwards routing or failure authority.
 * @evidence contracts/common.md#clear-and-simple-design Keeps HTTP middleware typing separate from Vite server construction so CommonJS scripts and the module host need not import Vite configuration for this callback type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The signature neither substitutes foreign HTTP methods nor claims a request is handled; the implementation must respond or delegate, preserving the supplied response owner.
 * @evidence contracts/common.md#meaningful-documentation Names Node HTTP arguments, delegation callback and the separate host-construction boundary; a void return is not evidence of completed asynchronous I/O.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A callable type performs no routing; request parsing, queue waits and response encoding belong to the concrete middleware and endpoint owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Requests and responses have distinct effects and lifetimes; sharing the callback type does not authorize sharing an earlier response or capture result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns listening sockets and request/response lifetimes; this type acquires no server, cancellation listener or pending callback population.
 *
 * @author Samchon
 */
export type HumanViewerMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: (error?: unknown) => void,
) => void;
