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
 *
 * @evidence contracts/common.md#clear-and-simple-design One dispatcher owns route ordering; data, capture and source-window owners retain their predicates.
 * @evidence contracts/common.md#principled-implementation Same-origin URL parsing feeds existing route owners in a fixed order, with unmatched requests delegated to Vite.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Routes original requests without reclassifying numerical operations, replacing failed captures or patching Vite handlers.
 * @evidence contracts/common.md#meaningful-documentation States request-local ownership and route ordering.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Same-origin URL parsing feeds existing route owners in a fixed order, with unmatched requests delegated to Vite.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view One dispatcher owns route ordering; data, capture and source-window owners retain their predicates.
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
