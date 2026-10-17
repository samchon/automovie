import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { writeArtifact } from "../io/writeArtifact.ts";
import type { ViewerSnapshot } from "./ViewerSnapshot.ts";
import { loadViewerSnapshot } from "./loadViewerSnapshot.ts";

/**
 * Owns an immutable local comparison listener, explicit browser assets and one declared renderer installation.
 *
 * @evidence contracts/common.md#principled-implementation Admits input hashes before listening, freezes HTML and bundled producer bytes, and confines module requests to the declared real root.
 * @evidence contracts/common.md#clear-and-simple-design The server routes frozen data and assets while the ordinary viewer package owns geometry and rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent reconstructed artifacts fail; this server never generates substitute skin or alters native render methods.
 * @evidence contracts/common.md#meaningful-documentation The comment states port-zero isolation, immutable input loading and the returned close boundary.
 * @evidence contracts/performance.md#efficient-algorithms Startup work follows input and asset bytes; requests reuse frozen payloads and renderer modules are read only when requested.
 * @evidence contracts/performance.md#reuse-equivalent-work One runtime reuses admitted source/model/HTML bytes until close; a different manifest requires another runtime.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one listener and payload map; sticky close ends connections and clears payloads, while asset buffers remain until the handle is unreachable.
 */
export async function serveViewer(options: {
  manifest: string;
  assets: string;
  renderer: string;
  output: string;
  port: number;
}): Promise<{ url: string; close: () => Promise<void> }> {
  if (
    !Number.isInteger(options.port) ||
    options.port < 0 ||
    options.port > 65535
  )
    throw new Error("Invalid local viewer port");
  const snapshot: ViewerSnapshot = loadViewerSnapshot(options.manifest);
  const assetRoot: string = fs.realpathSync(options.assets);
  const rendererRoot: string = fs.realpathSync(options.renderer);
  const htmlSource: Buffer = fs.readFileSync(
    path.join(assetRoot, "viewer.html"),
  );
  const controlsSource: Buffer = fs.readFileSync(
    path.join(assetRoot, "controls.html"),
  );
  const bridgeSource: Buffer = fs.readFileSync(
    path.join(assetRoot, "automovie-viewer.js"),
  );
  const digest: (bytes: Buffer) => string = (bytes: Buffer): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const html: string = htmlSource
    .toString("utf8")
    .replace("<!--CONTROLS-->", controlsSource.toString("utf8"));
  const manifest: object = {
    id: snapshot.id,
    loadedAt: snapshot.loadedAt,
    inputs: snapshot.manifest,
    geometry: snapshot.geometry,
    assets: {
      "viewer.html": digest(htmlSource),
      "controls.html": digest(controlsSource),
      "automovie-viewer.js": digest(bridgeSource),
    },
    limits: [
      "Reference comparison is a research display, not final product acceptance.",
      "Primary form comparison derives each mesh normal field from its own geometry; copied source shading is refused.",
    ],
  };
  const server: http.Server = http.createServer(
    (request: http.IncomingMessage, response: http.ServerResponse): void => {
      try {
        const url: URL = new URL(request.url ?? "/", "http://127.0.0.1");
        let body: string | Buffer | undefined;
        let type: string = "application/json";
        if (url.pathname === "/") {
          body = html;
          type = "text/html; charset=utf-8";
        } else if (url.pathname === "/automovie-viewer.js") {
          body = bridgeSource;
          type = "text/javascript";
        } else if (url.pathname === "/manifest")
          body = JSON.stringify(manifest);
        else if (url.pathname.startsWith("/three/")) {
          const file: string = fs.realpathSync(
            path.resolve(rendererRoot, url.pathname.slice(7)),
          );
          const relative: string = path.relative(rendererRoot, file);
          if (
            relative === ".." ||
            relative.startsWith(`..${path.sep}`) ||
            path.isAbsolute(relative)
          )
            throw new Error("Renderer module leaves its declared root");
          body = fs.readFileSync(file);
          type = "text/javascript";
        } else body = snapshot.payloads.get(url.pathname);
        if (body === undefined) {
          response.writeHead(404);
          response.end();
          return;
        }
        response.setHeader("Content-Type", type);
        response.setHeader("Cache-Control", "no-store");
        response.end(body);
      } catch (error: unknown) {
        response.writeHead(500);
        response.end(String(error));
      }
    },
  );
  await new Promise<undefined>(
    (
      resolve: (value: undefined) => void,
      reject: (error: Error) => void,
    ): void => {
      server.once("error", reject);
      server.listen(options.port, "127.0.0.1", (): void => resolve(undefined));
    },
  );
  const address: ReturnType<http.Server["address"]> = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Local viewer has no TCP address");
  }
  const url: string = `http://127.0.0.1:${address.port}`;
  try {
    writeArtifact(options.output, "runtime.json", {
      ...manifest,
      url,
      pid: process.pid,
    });
  } catch (error: unknown) {
    server.close();
    throw error;
  }
  let closing: Promise<void> | undefined;
  return {
    url,
    close: (): Promise<void> => {
      closing ??= (async (): Promise<void> => {
        try {
          await new Promise<undefined>(
            (
              resolve: (value: undefined) => void,
              reject: (error: Error) => void,
            ): void => {
              server.close((error?: Error): void =>
                error ? reject(error) : resolve(undefined),
              );
              server.closeAllConnections();
            },
          );
        } finally {
          snapshot.payloads.clear();
        }
      })();
      return closing;
    },
  };
}
