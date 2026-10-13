import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";

/**
 * Serve the application's fixed HTML entries without a development HMR client.
 * Vite still transforms requested modules, but its HTML/config invalidations
 * cannot replace a completed model. Source replacement follows the viewer's
 * own revision notification and checked candidate protocol.
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
