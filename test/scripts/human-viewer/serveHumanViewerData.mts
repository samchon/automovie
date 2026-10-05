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
    inputsDirectory, publish, json } = props;
  let { inventory } = props;
  const handled = (value: unknown): true => { json(value); return true; };
  /**
   * Stream a file only when its SHA-256 starts with the requested digest;
   * otherwise 409 with both digests. Hashing streams off the event loop.
   */
  const streamVerified = (file: string, digest: string, label: string): void => {
    void (async () => {
      const hasher = createHash("sha256");
      for await (const chunk of fs.createReadStream(file)) hasher.update(chunk as Buffer);
      const actual = hasher.digest("hex");
      if (!actual.startsWith(digest)) {
        response.statusCode = 409;
        json({ error: `${label} changed: digest ${actual.slice(0, 12)}, requested ${digest}` });
        return;
      }
      response.setHeader("Content-Type", "application/gzip");
      fs.createReadStream(file).pipe(response);
    })().catch((error: unknown) => {
      response.statusCode = 500;
      json({ error: `${label} could not be read: ` + (error instanceof Error ? error.message : String(error)) });
    });
  };
    if (url.pathname === "/docs") return handled(inventory);
    if (serveHumanViewerReference({
        url,
        response,
        root,
        storage,
        documents: inventory.documents.map((entry) => entry.id),
        json,
      })) return true;
    // The published one-skin person generation views. A request names the
    // digest prefix its document was keyed with (`?digest=<12 hex>`); the
    // bytes are hashed off the event loop and a replaced view is refused
    // with 409, so no build runs on views its key does not name. A missing
    // view is 404; the catalogue already lists the standard people as
    // rejected by name until both exist.
    if (url.pathname === "/basis/person/head" || url.pathname === "/basis/person/body") {
      const view = url.pathname.endsWith("head") ? "head" : "body";
      const file = props.generationFiles[view];
      const digest = url.searchParams.get("digest");
      if (digest === null || !/^[0-9a-f]{12,64}$/.test(digest)) {
        response.statusCode = 400;
        return handled({ error: `The ${view} view request must name the digest its document was built for (?digest=<hex>)` });
      }
      if (!fs.existsSync(file)) {
        response.statusCode = 404;
        response.end();
        return true;
      }
      streamVerified(file, digest, `The published ${view} view`);
      return true;
    }
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
      // Every basis request names the bytes its document was keyed with: a
      // published basis by `?digest=`, a candidate by `<name>@<digest>`.
      const expected = candidate === null ? url.searchParams.get("digest") ?? undefined : digest;
      if (expected === undefined || !/^[0-9a-f]{12,64}$/.test(expected)) {
        response.statusCode = 400;
        return handled({ error: `A ${domain} basis request must name the digest its document was built for` });
      }
      // The file must still be those bytes: a worker that asks for a replaced
      // file is refused instead of building the new bytes under the old key.
      streamVerified(file, expected, candidate === null ? `The published ${domain} basis` : `Candidate ${name}`);
      return true;
    }
    if (url.pathname === "/rescan") {
      // A rescan answers after every sidecar read and page admission it
      // started has finished, so a new candidate is decided, not "still being
      // read"; only a page that is not ready leaves inputs pending, and the
      // response marks those `pending` apart from refusals.
      void props.settleInputs().then((settled) => {
        inventory = settled;
        publish(inventory);
        handled({
          documents: inventory.documents
            .filter((entry) => entry.id.startsWith("file:"))
            .map((entry) => entry.id),
          rejected: inventory.rejected,
        });
      }).catch((error: unknown) => {
        response.statusCode = 500;
        json({ error: "Rescan failed: " + (error instanceof Error ? error.message : String(error)) });
      });
      return true;
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
