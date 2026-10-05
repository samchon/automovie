import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";
import { admitHumanViewerCachePayload } from "./admitHumanViewerCachePayload";

const gzipAsync = promisify(gzip);

/**
 * Answer `/cache/<key>-direct` and `/cache/<key>-ao`: read (GET) or store
 * (PUT) the numerical preview of a current catalogue key. A key no current
 * document names is refused with 409, so no stale model is read or written;
 * a PUT from a page whose code is not proven to be the current revision
 * (its `X-Human-Generation` token) is refused with 409 too.
 * A PUT is admitted by `admitHumanViewerCachePayload` and stored as received,
 * gzip-compressed on the zlib thread pool so `/health` keeps answering, under
 * a per-process temporary name and renamed into place (viewers on other
 * ports share the folder). A missing entry is 404; other methods 405.
 * Returns whether the path was a cache route.
 *
 * @evidence contracts/common.md#principled-implementation Cache authority is the current catalogue key; writes are atomic and admitted.
 * @evidence contracts/common.md#clear-and-simple-design One route owns cache transfer; payload admission is its own validator.
 * @evidence contracts/common.md#meaningful-documentation States the 204, 400, 404, 405 and 409 answers and the write path.
 */
export function serveHumanViewerCache(props: IServeHumanViewerDataProps): boolean {
  const { url, request, response } = props;
  if (!url.pathname.startsWith("/cache/")) return false;
  const key = url.pathname.slice(7);
  if (!props.inventory.documents.some((document) =>
    key === document.key + "-direct" || key === document.key + "-ao")) {
    response.statusCode = 409;
    props.json({ error: "Unknown or stale numerical cache identity" });
    return true;
  }
  const file = path.join(props.storage, "cache", key + ".json.gz");
  if (request.method === "PUT") {
    // A result is stored only from code proven to be the current revision: a
    // candidate that loaded a held compile names current keys but ran older code.
    const token = request.headers["x-human-generation"];
    if (!props.currentCode(typeof token === "string" ? token : null)) {
      response.statusCode = 409;
      props.json({ error: "The writing page does not run the current source; its result is not cached" });
      return true;
    }
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      void (async () => {
        const body = Buffer.concat(chunks);
        admitHumanViewerCachePayload(body);
        const temporary = `${file}.${process.pid}.tmp`;
        await fs.promises.writeFile(temporary, await gzipAsync(body));
        await fs.promises.rename(temporary, file);
        response.statusCode = 204;
        response.end();
      })().catch((error: unknown) => {
        response.statusCode = 400;
        props.json({ error: "Invalid numerical cache payload: " +
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
