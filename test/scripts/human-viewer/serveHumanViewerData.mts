/**
 * Published data endpoints for the resident viewer, independent of GPU work.
 * This adapter owns validated basis streaming and numerical cache transfer;
 * the host supplies the current catalogue and publishes rescans atomically.
 * Compression uses asynchronous zlib so capture never blocks health handling.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";
import { serveHumanViewerReference } from "./serveHumanViewerReference.mjs";

const gzipAsync = promisify(gzip);
/** The members of the numerical preview projection the page persists. */
const CACHE_FIELDS = new Set(["operation", "model", "articulation", "contact", "crossings", "extras", "anatomy"]);

/** Return whether a data route answered this request, leaving GPU routes to the host. */
export function serveHumanViewerData(props: IServeHumanViewerDataProps): boolean {
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
      const candidate = url.searchParams.get("candidate");
      // A person has no published basis: only a candidate packet beside a
      // hand-written person document, `<name>.person.json.gz`.
      if ((domain !== "face" && domain !== "body" && domain !== "person") ||
          (domain === "person" && candidate === null) ||
          (candidate !== null && !/^[A-Za-z0-9._-]+(@[0-9a-f]+)?$/.test(candidate))) {
        response.statusCode = 404;
        response.end();
        return true;
      }
      const [name, digest] = (candidate ?? "").split("@");
      const file =
        candidate === null
          ? basisFiles[domain as "face" | "body"]
          : path.join(inputsDirectory, name + (domain === "person" ? ".person.json.gz" : ".basis.json.gz"));
      if (!fs.existsSync(file)) {
        response.statusCode = 404;
        response.end();
        return true;
      }
      if (digest === undefined) {
        response.setHeader("Content-Type", "application/gzip");
        fs.createReadStream(file).pipe(response);
        return true;
      }
      // A candidate named with a digest must still be those bytes: a worker
      // that asks for a replaced file is refused instead of building the new
      // bytes under the old document key. Hashing streams off the event loop.
      void (async () => {
        const hasher = createHash("sha256");
        for await (const chunk of fs.createReadStream(file)) hasher.update(chunk as Buffer);
        const actual = hasher.digest("hex");
        if (!actual.startsWith(digest)) {
          response.statusCode = 409;
          json({ error: `Candidate ${name} changed: digest ${actual.slice(0, 12)}, requested ${digest}` });
          return;
        }
        response.setHeader("Content-Type", "application/gzip");
        fs.createReadStream(file).pipe(response);
      })().catch((error: unknown) => {
        response.statusCode = 500;
        json({ error: "Candidate read failed: " + (error instanceof Error ? error.message : String(error)) });
      });
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
            const body = Buffer.concat(chunks);
            const payload: unknown = JSON.parse(body.toString("utf8"));
            // The page sends the numerical projection exactly; any other
            // member could carry display or photograph data onto disk, so it
            // is refused rather than silently dropped or re-encoded.
            if (payload === null || typeof payload !== "object" || Array.isArray(payload))
              throw new Error("the payload is not a JSON object");
            const extra = Object.keys(payload).filter((name) => !CACHE_FIELDS.has(name));
            if (extra.length !== 0)
              throw new Error("members outside the numerical projection: " + extra.join(", "));
            if (!("operation" in payload) || payload.operation !== "preview" ||
                !("model" in payload) || payload.model === undefined)
              throw new Error("expected a numerical preview with a model");
            // The validated bytes are stored as received: re-encoding them
            // gave the same text at several seconds per document. Compression
            // runs off the event loop so /health keeps answering. Viewers on
            // other ports share this directory, so the temporary file is
            // this process's own.
            const temporary = `${file}.${process.pid}.tmp`;
            await fs.promises.writeFile(temporary, await gzipAsync(body));
            await fs.promises.rename(temporary, file);
            response.statusCode = 204;
            response.end();
          })().catch((error: unknown) => {
            response.statusCode = 400;
            json({ error: "Invalid numerical cache payload: " +
              (error instanceof Error ? error.message : String(error)) });
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
