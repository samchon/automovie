import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";

/**
 * Serve the application's fixed HTML entries without a development HMR client.
 * Vite still transforms requested modules, but its HTML/config invalidations
 * cannot replace a completed model. Source replacement follows the viewer's
 * own revision notification and checked candidate protocol.
 *
 * @evidence contracts/common.md#principled-implementation Fixed application entry routing supplies original HTML while the viewer's source candidate protocol independently owns model replacement.
 * @evidence contracts/common.md#clear-and-simple-design One fixed route map serves entry pages before Vite, leaving module transformation and source watching to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses ordinary filesystem response streaming rather than patching a foreign reload function or restarting a completed viewport after a file edit.
 * @evidence contracts/common.md#meaningful-documentation Explains HMR-client separation, continued module transformation and the application's checked source-replacement authority.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Preserves the displayed model and camera during application source edits.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Separates fixed page delivery from development-server page reloads.
 */
export function serveHumanViewerPages(directory: string) {
  const pages = new Map([
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/view", "view.html"],
    ["/view.html", "view.html"],
    ["/scene.html", "scene.html"],
    ["/parts.html", "parts.html"],
  ]);
  return (pathname: string, response: ServerResponse): boolean => {
    const page = pages.get(pathname);
    if (page === undefined) return false;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    fs.createReadStream(path.join(directory, page))
      .once("error", (error: Error) => {
        if (response.headersSent) response.destroy(error);
        else {
          response.statusCode = 500;
          response.end("The Human viewer page could not be read: " + error.message);
        }
      })
      .pipe(response);
    return true;
  };
}
