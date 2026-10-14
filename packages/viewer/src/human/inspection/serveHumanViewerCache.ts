import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";
import { admitHumanViewerCachePayload } from "./admitHumanViewerCachePayload.js";

const gzipAsync: (buffer: Uint8Array) => Promise<Buffer> = promisify(gzip);

/**
 * Answer `/cache/<key>-direct` and `/cache/<key>-ao`: read (GET) or store (PUT) the numerical preview of a current catalogue key. A key no current document names at request admission is refused with 409; a PUT from a page whose code is not proven to be the current revision (its `X-Human-Generation` token) is refused with 409 too. Key/token checks precede asynchronous body/compression/publication and are not rechecked at rename, so an intervening source edit can leave an older keyed file that later current-catalogue GET admission refuses. A PUT is admitted by `admitHumanViewerCachePayload` and stored as received under a unique temporary name before rename (viewers on other ports share the folder). Gzip runs asynchronously on the zlib thread pool, but body concatenation, UTF-8 decoding and JSON envelope admission still run synchronously on the event loop. A missing entry is 404; other methods 405. Returns whether the path was a cache route.
 *
 * @evidence contracts/common.md#principled-implementation Admits a current catalogue cache key and PUT generation token, checks the existing payload envelope, asynchronously gzips bytes and atomically renames a uniquely owned temporary file.
 * @evidence contracts/common.md#clear-and-simple-design GET streaming and PUT request/body/temp ownership stay in the existing cache route; payload semantics remain with the admission helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Concurrent same-key PUTs have distinct UUID temporary names, aborted bodies are withdrawn and cleaned, and admission is not claimed to validate the full numerical model.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes key/token refusal, payload admission, atomic replacement, reader lifetime and the initial generation check's scope.
 * @evidence contracts/performance.md#efficient-algorithms Catalogue admission scans D entries; PUT concat/admission/compression cost body bytes with worker-pool gzip, while GET streams compressed file bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Disk entries are named by catalogue key and preview mode, and unknown current identities refuse; concurrent writes are distinct effects rather than shared merely by equal keys.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Request listeners/chunks withdraw on end, abort, error or response close; owned UUID temp files retire after publication/refusal and GET readers close with their response. Body bytes and concurrent PUT count remain uncapped in this route.
 */
export function serveHumanViewerCache(
  props: IServeHumanViewerDataProps,
): boolean {
  const {
    url,
    request,
    response,
  }: Pick<IServeHumanViewerDataProps, "url" | "request" | "response"> = props;
  if (!url.pathname.startsWith("/cache/")) return false;
  const key: string = url.pathname.slice(7);
  if (
    !props.inventory.documents.some(
      (
        document: IServeHumanViewerDataProps["inventory"]["documents"][number],
      ): boolean =>
        key === document.key + "-direct" || key === document.key + "-ao",
    )
  ) {
    response.statusCode = 409;
    props.json({ error: "Unknown or stale numerical cache identity" });
    return true;
  }
  const file: string = path.join(props.storage, "cache", key + ".json.gz");
  if (request.method === "PUT") {
    // A result is stored only from code proven to be the current revision: a
    // candidate that loaded a held compile names current keys but ran older code.
    const token: string | string[] | undefined =
      request.headers["x-human-generation"];
    if (!props.currentCode(typeof token === "string" ? token : null)) {
      response.statusCode = 409;
      props.json({
        error:
          "The writing page does not run the current source; its result is not cached",
      });
      return true;
    }
    const chunks: Buffer[] = [];
    const data: (chunk: Buffer) => void = (chunk: Buffer): void => {
      chunks.push(chunk);
    };
    function withdraw(): void {
      request.off("data", data);
      request.off("end", ended);
      request.off("aborted", aborted);
      response.off("close", aborted);
    }
    function aborted(): void {
      withdraw();
      chunks.length = 0;
    }
    function closed(): void {
      aborted();
      request.off("error", failed);
    }
    function failed(error: Error): void {
      aborted();
      if (!response.destroyed) response.destroy(error);
    }
    function ended(): void {
      withdraw();
      void (async (): Promise<void> => {
        const body: Buffer = Buffer.concat(chunks);
        chunks.length = 0;
        admitHumanViewerCachePayload(body);
        const temporary: string = `${file}.${process.pid}.${randomUUID()}.tmp`;
        const retire: () => Promise<void> = createAutoMovieResourceRetirement([
          async (): Promise<void> => {
            await fs.promises.rm(temporary, { force: true });
          },
        ]);
        try {
          await fs.promises.writeFile(temporary, await gzipAsync(body));
          await fs.promises.rename(temporary, file);
        } catch (error) {
          return createAutoMovieResourceRetirement([retire], { error })();
        }
        await retire();
        response.statusCode = 204;
        response.end();
      })().catch((error: unknown): void => {
        response.statusCode = 400;
        props.json({
          error:
            "Invalid numerical cache payload: " +
            (error instanceof Error ? error.message : String(error)),
        });
      });
    }
    request.on("data", data);
    request.once("end", ended);
    request.on("error", failed);
    request.once("close", closed);
    request.once("aborted", aborted);
    response.once("close", aborted);
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
  const stream: fs.ReadStream = fs.createReadStream(file);
  const closed: () => void = (): void => {
    stream.destroy();
  };
  response.once("close", closed);
  stream.once("close", (): void => {
    response.off("close", closed);
  });
  stream.once("error", (error: Error): void => {
    response.destroy(error);
  });
  stream.pipe(response);
  return true;
}
