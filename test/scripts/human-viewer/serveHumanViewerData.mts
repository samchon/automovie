/**
 * Published data endpoints for the resident viewer, independent of GPU work.
 * This adapter owns validated basis streaming and numerical cache transfer;
 * the host supplies the current catalogue and publishes rescans atomically.
 * Compression uses asynchronous zlib so capture never blocks health handling.
 */
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { encodeHumanViewerPreview } from "./encodeHumanViewerPreview";
import { serveHumanViewerReference } from "./serveHumanViewerReference.mjs";

const gzipAsync = promisify(gzip);

/** Return whether a data route answered this request, leaving GPU routes to the host. */
export function serveHumanViewerData(props: {
  url: URL;
  request: IncomingMessage;
  response: ServerResponse;
  root: string;
  storage: string;
  basisFiles: { face: string; body: string };
  inputsDirectory: string;
  inventory: HumanViewerCatalogue;
  catalogue: () => HumanViewerCatalogue;
  publish: (inventory: HumanViewerCatalogue) => void;
  json: (value: unknown) => void;
}): boolean {
  const { url, request, response, root, storage, basisFiles,
    inputsDirectory, catalogue, publish, json } = props;
  let { inventory } = props;
  const handled = (value: unknown): true => { json(value); return true; };
    if (url.pathname === "/docs") return handled(inventory);
    if (serveHumanViewerReference({
        url,
        response,
        root,
        storage,
        documents: inventory.documents.map((entry) => entry.id),
        json,
      })) return true;
    if (url.pathname.startsWith("/basis/")) {
      const domain = url.pathname.slice(7);
      if (domain !== "face" && domain !== "body") {
        response.statusCode = 404;
        response.end();
        return true;
      }
      const candidate = url.searchParams.get("candidate");
      const file =
        candidate === null
          ? basisFiles[domain]
          : path.join(
              inputsDirectory,
              candidate.split("@")[0] + ".basis.json.gz",
            );
      if (
        (candidate !== null && !/^[A-Za-z0-9._-]+(@[0-9a-f]+)?$/.test(candidate)) ||
        !fs.existsSync(file)
      ) {
        response.statusCode = 404;
        response.end();
        return true;
      }
      response.setHeader("Content-Type", "application/gzip");
      fs.createReadStream(file).pipe(response);
      return true;
    }
    if (url.pathname === "/rescan") {
      inventory = catalogue();
      publish(inventory);
      return handled({
        documents: inventory.documents
          .filter((entry) => entry.id.startsWith("file:"))
          .map((entry) => entry.id),
        rejected: inventory.rejected,
      });
    }
    if (url.pathname.startsWith("/cache/")) {
      const key = url.pathname.slice(7);
      if (
        !inventory.documents.some(
          (document) =>
            key === document.key + "-direct" || key === document.key + "-ao",
        )
      ) {
        response.statusCode = 409;
        return handled({ error: "Unknown or stale numerical cache identity" });
      }
      const file = path.join(storage, "cache", key + ".json.gz");
      if (request.method === "PUT") {
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => {
          void (async () => {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (payload.operation !== "preview" || payload.model === undefined)
              throw new Error("Expected numerical preview");
            // Compression runs off the event loop so /health keeps answering.
            await fs.promises.writeFile(
              file + ".tmp",
              await gzipAsync(encodeHumanViewerPreview(payload)),
            );
            await fs.promises.rename(file + ".tmp", file);
            response.statusCode = 204;
            response.end();
          })().catch(() => {
            response.statusCode = 400;
            json({ error: "Invalid numerical cache payload" });
          });
        });
        return true;
      }
      if (request.method !== "GET") {
        response.statusCode = 405;
        response.end();
        return true;
      }
      if (!fs.existsSync(file)) {
        response.statusCode = 404;
        response.end();
        return true;
      }
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Content-Encoding", "gzip");
      fs.createReadStream(file).pipe(response);
      return true;
    }
  return false;
}
