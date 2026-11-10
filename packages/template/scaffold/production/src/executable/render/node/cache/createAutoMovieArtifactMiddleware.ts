import type { IAutoMovieArtifactStore } from "@automovie/engine";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Serve an artifact store to browser pages through
 * `createAutoMovieHttpArtifactStore`, as Connect-style middleware for a
 * development server.
 *
 * Mount it under a prefix, which Connect and Vite strip from `request.url`, so
 * the remaining path is `/<64 hex digits>`: `GET` answers the bytes with header
 * `x-automovie-artifact-digest` or 404, `PUT` stores a body whose SHA-256
 * equals that header (400 otherwise, so a damaged upload is never stored),
 * `DELETE` removes. Other paths go to `next`, or 404 without one; other methods
 * answer 405. Serve it only from a development server bound to the local
 * machine: any page that reaches it can write cache entries.
 *
 * @param store Backing store, usually `createAutoMovieDirectoryArtifactStore(".cache/artifacts")`.
 * @param maxBytes Largest accepted upload; defaults to 512 MiB.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Node's request stream is read to completion and verified against the declared digest before the store's atomic write; status codes follow HTTP semantics (404 absent, 400 bad body, 405 method, 413 too large).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Transport only, mirroring the HTTP store; the store owns layout and the engine owns reuse.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Paths outside the key form and unverified bodies are refused rather than repaired.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in body size per request: one buffer concatenation and one digest.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Requests share nothing; the engine resolver decides reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one request body, at most maxBytes, until the response ends; the store's handles close per call.
 * @evidence contracts/development/common.md#meaningful-documentation States mounting, routes, statuses, the size limit and the local-only requirement.
 */
export function createAutoMovieArtifactMiddleware(
  store: IAutoMovieArtifactStore,
  maxBytes: number = 512 * 1024 ** 2,
): (
  request: IncomingMessage,
  response: ServerResponse,
  next?: () => void,
) => void {
  const serve: (
    request: IncomingMessage,
    response: ServerResponse,
    hex: string,
  ) => Promise<void> = async (
    request: IncomingMessage,
    response: ServerResponse,
    hex: string,
  ): Promise<void> => {
    const key: string = `sha256:${hex}`;
    if (request.method === "GET") {
      const entry: IAutoMovieArtifactStore.IEntry | undefined =
        await store.read(key);
      if (entry === undefined) return end(response, 404);
      response.writeHead(200, {
        "content-type": "application/octet-stream",
        [HEADER]: entry.digest,
      });
      response.end(entry.bytes);
      return;
    }
    if (request.method === "DELETE") {
      await store.remove(key);
      return end(response, 204);
    }
    if (request.method !== "PUT") return end(response, 405);

    const chunks: Buffer[] = [];
    let length: number = 0;
    for await (const chunk of request) {
      length += (chunk as Buffer).length;
      if (length > maxBytes) return end(response, 413);
      chunks.push(chunk as Buffer);
    }
    const bytes: Buffer = Buffer.concat(chunks);
    const digest: string | string[] | undefined = request.headers[HEADER];
    if (typeof digest !== "string" || (await store.digest(bytes)) !== digest)
      return end(response, 400);
    await store.write(key, { bytes, digest });
    end(response, 204);
  };
  return (
    request: IncomingMessage,
    response: ServerResponse,
    next?: () => void,
  ): void => {
    const hex: string | undefined = /^\/([0-9a-f]{64})(?:\?.*)?$/.exec(
      request.url ?? "",
    )?.[1];
    if (hex === undefined) {
      if (next !== undefined) next();
      else end(response, 404);
      return;
    }
    serve(request, response, hex).catch((error: unknown): void => {
      if (!response.headersSent) end(response, 500);
      else response.destroy(error as Error);
    });
  };
}

/** Header carrying an entry's recorded `sha256:` digest. */
const HEADER: string = "x-automovie-artifact-digest";

/** Answer a bodiless status. */
const end: (response: ServerResponse, status: number) => void = (
  response: ServerResponse,
  status: number,
): void => {
  response.writeHead(status);
  response.end();
};
