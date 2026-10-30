import type { ServerResponse } from "node:http";

import { normalizeHumanCurves } from "../human/normalizeHumanCurves";
import type { HumanImageArchive } from "./HumanImageArchive";
import type { HumanImageSession } from "./HumanImageSession";

/** Publish the verified ordinary frame's original response, archive event and headers.
 *
 * @evidence contracts/common.md#principled-implementation Uses the Session-qualified result for exact PNG/capture headers and the original live event; fresh misses enter the existing archive before the response body is sent.
 * @evidence contracts/common.md#clear-and-simple-design The route retains request admission and generation, while this helper owns only their ordinary response assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing actual capture identity rejects; cached pixels retain their existing capture/cache meaning.
 * @evidence contracts/common.md#meaningful-documentation Receipt mode returns the original full receipt and PNG mode returns the original bytes; both retain the same actual identity headers.
 * @evidence contracts/performance.md#efficient-algorithms Header assembly is fixed work and event/receipt encoding scales with the actual response; no generation, geometry parse or additional serializer is added.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the Session result and the archive's existing live producer path without another draw.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Response-local event data is released on return; archive retention remains with the borrowed archive owner.
 */
export function respondHumanImage(options: {
  response: ServerResponse;
  url: URL;
  archive: HumanImageArchive;
  result: Awaited<ReturnType<HumanImageSession["image"]>>;
  alias?: string;
  requested: string;
  curves: string;
  view: string;
}): void {
  const { response, url, archive, result, alias, requested, curves, view }: typeof options = options;
  if (!result.capturedUtc || !result.pngSha256)
    throw new Error("Human PNG has no committed capture receipt");
  response.setHeader("x-human-captured-utc", result.capturedUtc);
  response.setHeader(
    "x-human-fresh-nonce",
    url.searchParams.get("fresh") ?? "none",
  );
  response.setHeader("x-human-identity", result.key);
  response.setHeader("x-human-png-sha256", result.pngSha256);
  response.setHeader(
    "x-human-cache",
    result.cacheHit ? "existing-png" : "new-requested-frame",
  );
  const event: object = {
    kind: "human-image-response",
    alias,
    image: requested,
    curves,
    view: view,
    key: result.key,
    cacheHit: result.cacheHit,
    ...(result.cacheHit ? {} : { receipt: result.receipt }),
  };
  if (url.searchParams.has("fresh") && !result.cacheHit)
    response.setHeader(
      "x-human-archive-url",
      archive.publishEvent(url.href, result.png, event),
    );
  response.setHeader("x-human-binding", "current-generation");
  response.setHeader(
    "x-human-curves",
    curves === "" ? "none" : normalizeHumanCurves.query(curves),
  );
  response.setHeader(
    "x-human-view",
    view === "" ? "none" : view,
  );
  console.info(JSON.stringify(event));
  if (url.searchParams.get("receipt") === "1") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(result.receipt));
    return;
  }
  response.setHeader("content-type", "image/png");
  response.setHeader("x-human-identity", result.key);
  response.setHeader("x-human-png-sha256", result.pngSha256);
  response.setHeader(
    "x-human-cache",
    result.cacheHit ? "existing-png" : "new-requested-frame",
  );
  response.end(result.png);
}
