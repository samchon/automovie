import type { HumanViewerMiddleware } from "./HumanViewerMiddleware.js";
import type { ICreateHumanViewerMiddlewareProps } from "./ICreateHumanViewerMiddlewareProps.js";
import { serveHumanViewerCapture } from "./serveHumanViewerCapture.js";
import { serveHumanViewerData } from "./serveHumanViewerData.js";
import { serveHumanViewerGeneration } from "./serveHumanViewerGeneration.js";
import { serveHumanViewerHeap } from "./serveHumanViewerHeap.js";
import { serveHumanViewerNumerical } from "./serveHumanViewerNumerical.js";

/**
 * Route HTTP requests through their existing domain owners before Vite serves the page. Request-local URL/response bindings never become cached host state.
 *
 * @evidence contracts/common.md#principled-implementation Health, events, display, numerical, generation, heap, data and capture requests route to their existing owners before page and Vite fallback handling.
 * @evidence contracts/common.md#clear-and-simple-design A request-local URL and JSON writer supply each route with current host facts rather than a second server state cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Owner refusals propagate through the middleware seam and unmatched paths call next instead of being fabricated as successful product responses.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies route ownership, Vite fallback and the request-local lifetime of transport bindings.
 * @evidence contracts/performance.md#efficient-algorithms A fixed sequence of route checks adds constant dispatch work plus URL parsing and any actual JSON response serialization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Dispatch reads each request's current facts; result equivalence and any caching stay with the domain route owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only server props; URLs and response closures belong to one request, while long-lived event streams are registered and released by their own owner.
 */
export function createHumanViewerMiddleware(
  props: ICreateHumanViewerMiddlewareProps,
): HumanViewerMiddleware {
  return (
    request: Parameters<HumanViewerMiddleware>[0],
    response: Parameters<HumanViewerMiddleware>[1],
    next: Parameters<HumanViewerMiddleware>[2],
  ): void => {
    const url: URL = new URL(request.url ?? "/", props.origin);
    const json: (value: unknown) => void = (value: unknown): void => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(value));
    };
    if (url.pathname === "/health") return json(props.health());
    if (url.pathname === "/source-events")
      return props.sourceEvents.subscribe(response);
    if (url.pathname === "/display") return props.display(request, response);
    if (
      serveHumanViewerNumerical({
        url,
        request,
        response,
        service: props.numerical,
      })
    )
      return;
    if (
      serveHumanViewerGeneration({ ...props.generation, url, response, json })
    )
      return;
    if (url.pathname === "/heap")
      return serveHumanViewerHeap({ ...props.heap, response, json });
    if (serveHumanViewerData({ ...props.data(), url, request, response, json }))
      return;
    if (
      serveHumanViewerCapture({
        ...props.capture,
        url,
        request,
        response,
        json,
      })
    )
      return;
    if (props.pages(url.pathname, response)) return;
    next();
  };
}
