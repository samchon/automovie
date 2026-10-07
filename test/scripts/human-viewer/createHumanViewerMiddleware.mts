import type { HumanViewerMiddleware } from "./HumanViewerMiddleware";

import type { ICreateHumanViewerMiddlewareProps } from "./ICreateHumanViewerMiddlewareProps";
import { serveHumanViewerCapture } from "./serveHumanViewerCapture.mjs";
import { serveHumanViewerData } from "./serveHumanViewerData.mjs";
import { serveHumanViewerGeneration } from "./serveHumanViewerGeneration";
import { serveHumanViewerHeap } from "./serveHumanViewerHeap";

/**
 * Route HTTP requests through their existing domain owners before Vite serves
 * the page. Request-local URL/response bindings never become cached host state.
 *
 * @evidence contracts/common.md#clear-and-simple-design One dispatcher owns route ordering; data, capture and source-window owners retain their predicates.
 * @evidence contracts/common.md#meaningful-documentation States request-local ownership and route ordering.
 */
export function createHumanViewerMiddleware(
  props: ICreateHumanViewerMiddlewareProps,
): HumanViewerMiddleware {
  return (request, response, next) => {
    const url = new URL(request.url ?? "/", props.origin);
    const json = (value: unknown): void => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(value));
    };
    if (url.pathname === "/health") return json(props.health());
    if (serveHumanViewerGeneration({ ...props.generation, url, response, json })) return;
    if (url.pathname === "/heap")
      return serveHumanViewerHeap({ ...props.heap, response, json });
    if (serveHumanViewerData({ ...props.data(), url, request, response, json })) return;
    if (serveHumanViewerCapture({ ...props.capture, url, request, response, json })) return;
    if (url.pathname === "/view") request.url = "/view.html" + url.search;
    next();
  };
}
