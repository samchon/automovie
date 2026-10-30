import type { IncomingMessage, ServerResponse } from "node:http";

import type { HumanImageArchive } from "./HumanImageArchive";
import { HumanImageParameterRequest } from "./HumanImageParameterRequest";
import type { HumanImageSession } from "./HumanImageSession";

/** Serve actual Mannequin frames through the maintained Human HTTP/header/archive seam.
 *
 * @evidence contracts/common.md#principled-implementation Admits an existing bounded JSON request, delegates to the same queued worker owner, then binds actual PNG SHA/time and model/source/input/construction receipt to existing response headers and archive qualification.
 * @evidence contracts/common.md#clear-and-simple-design This page-specific route has no server, process, queue, renderer or serializer of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the explicit whole/face, front/right/back/oblique-front and three diagnostic pass names are admitted; worker input/source/GPU failures propagate, and Mannequin remains labeled as a rigid prototype.
 * @evidence contracts/common.md#meaningful-documentation POST selects the actual paused state including supported controller/hint inputs; fresh and receipt use existing semantics, with same-fresh receipt requests reusing pixels.
 * @evidence contracts/performance.md#efficient-algorithms Metadata/PNG delivery reuses the completed frame; receipt-only returns no PNG response body and performs no additional draw.
 * @evidence contracts/performance.md#reuse-equivalent-work The Session retains the exact key/frame/nonce and the existing archive retains original historical bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Request and response values are call-owned; retained frames/archive bytes remain bounded by their existing owners.
 */
export async function serveHumanMannequinImage(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  session: HumanImageSession,
  archive: HumanImageArchive,
): Promise<void> {
  const match: RegExpExecArray | null =
    /^\/human-images\/mannequin\/((?:whole|face)-(?:front|right|back|oblique-front)\.(?:surface|overlay|construction)\.png)$/.exec(
      url.pathname,
    );
  if (match === null || request.method !== "POST") {
    response.statusCode = match === null ? 404 : 405;
    response.end();
    return;
  }
  const input: Awaited<ReturnType<typeof HumanImageParameterRequest>> =
    await HumanImageParameterRequest(request);
  const result: Awaited<ReturnType<HumanImageSession["mannequin"]>> =
    await session.mannequin(
      input,
      match[1],
      url.searchParams.get("fresh") ?? undefined,
    );
  if (!result.capturedUtc || !result.pngSha256)
    throw new Error("Mannequin frame lacks actual capture commitment");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-human-stage", "mannequin-prototype");
  response.setHeader("x-human-binding", "mannequin-prototype");
  response.setHeader("x-human-identity", result.key);
  response.setHeader("x-human-captured-utc", result.capturedUtc);
  response.setHeader("x-human-png-sha256", result.pngSha256);
  response.setHeader(
    "x-human-fresh-nonce",
    url.searchParams.get("fresh") ?? "none",
  );
  response.setHeader(
    "x-human-cache",
    result.cacheHit ? "existing-png" : "new-requested-frame",
  );
  const event: object = {
    kind: "human-image-response",
    alias: "mannequin",
    image: match[1],
    key: result.key,
    cacheHit: result.cacheHit,
    ...(result.cacheHit ? {} : { receipt: result.receipt }),
  };
  if (url.searchParams.has("fresh") && !result.cacheHit)
    response.setHeader(
      "x-human-archive-url",
      archive.publishEvent(url.href, result.png, event),
    );
  response.setHeader(
    "content-type",
    url.searchParams.get("receipt") === "1" ? "application/json" : "image/png",
  );
  response.end(
    url.searchParams.get("receipt") === "1"
      ? JSON.stringify(result.receipt)
      : result.png,
  );
}
