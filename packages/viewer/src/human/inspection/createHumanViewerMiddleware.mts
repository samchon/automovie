import type { HumanViewerMiddleware } from "./HumanViewerMiddleware.js";

import type { ICreateHumanViewerMiddlewareProps } from "./ICreateHumanViewerMiddlewareProps.js";
import { serveHumanViewerCapture } from "./serveHumanViewerCapture.mjs";
import { serveHumanViewerData } from "./serveHumanViewerData.mjs";
import { serveHumanViewerGeneration } from "./serveHumanViewerGeneration.js";
import { serveHumanViewerHeap } from "./serveHumanViewerHeap.js";
import { serveHumanViewerNumerical } from "./serveHumanViewerNumerical.js";

/**
 * Route HTTP requests through their existing domain owners before Vite serves
 * the page. Request-local URL/response bindings never become cached host state.
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
    if (url.pathname === "/source-events")
      return props.sourceEvents.subscribe(response);
    if (url.pathname === "/display") return props.display(request, response);
    if (serveHumanViewerNumerical({ url, request, response, service: props.numerical })) return;
    if (serveHumanViewerGeneration({ ...props.generation, url, response, json })) return;
    if (url.pathname === "/heap")
      return serveHumanViewerHeap({ ...props.heap, response, json });
    if (serveHumanViewerData({ ...props.data(), url, request, response, json })) return;
    if (serveHumanViewerCapture({ ...props.capture, url, request, response, json })) return;
    if (props.pages(url.pathname, response)) return;
    next();
  };
}
