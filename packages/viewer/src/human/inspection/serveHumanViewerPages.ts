import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";

/**
 * Serve the application's fixed HTML entries without a development HMR client. Vite still transforms requested modules, but its HTML/config invalidations cannot replace a completed model. Source replacement follows the viewer's own revision notification and checked candidate protocol.
 *
 * @evidence contracts/common.md#principled-implementation Selects the existing fixed HTML entry table and streams raw files so source-generation replacement follows the viewer's checked candidate protocol rather than an injected HMR client.
 * @evidence contracts/common.md#clear-and-simple-design One closure owns the fixed route map and each matched response's reader; Vite still owns subsequent requested-module transforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary request paths do not become filesystem paths, and raw HTML serving does not assert that requested modules came from current source.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies fixed page entries, HMR exclusion and separate checked source-generation ownership.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-table lookup precedes streaming linear in HTML bytes, using stream buffering without reading the complete page into a server string.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable route map is shared by requests, but each response owns a fresh file stream and no stale HTML-byte cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A matched request owns one reader; response close destroys it, read refusal reports or destroys the response and stream close withdraws its exact response listener.
 */
export function serveHumanViewerPages(directory: string): (pathname: string, response: ServerResponse) => boolean {
  const pages: Map<string, string> = new Map([
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/view", "view.html"],
    ["/view.html", "view.html"],
    ["/scene.html", "scene.html"],
    ["/parts.html", "parts.html"],
  ]);
  return (pathname: string, response: ServerResponse): boolean => {
    const page: string | undefined = pages.get(pathname);
    if (page === undefined) return false;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    const stream: fs.ReadStream = fs.createReadStream(path.join(directory, page));
    const closed: () => void = (): void => { stream.destroy(); };
    response.once("close", closed);
    stream.once("close", (): void => { response.off("close", closed); });
    stream.once("error", (error: Error): void => {
        if (response.headersSent) response.destroy(error);
        else {
          response.statusCode = 500;
          response.end("The Human viewer page could not be read: " + error.message);
        }
      });
    stream.pipe(response);
    return true;
  };
}
