import fs from "node:fs";
import type { ServerResponse } from "node:http";

/**
 * Stream a stored PNG with its provenance headers (build source, revision and whether it is stale), so a thumbnail answered from disk says what drew it.
 *
 * @evidence contracts/common.md#principled-implementation Sets PNG metadata and pipes the actual file stream to the response, destroying the owned reader when the response closes and propagating read failure to the response.
 * @evidence contracts/common.md#clear-and-simple-design This small sender owns file-reader lifetime while thumbnail/reference identity and response selection remain with their route.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper serves file bytes without treating cache headers as anatomical or current-source proof; read errors do not silently become an empty successful PNG.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies streamed PNG output, caller-supplied headers and reader teardown on client loss or failure.
 * @evidence contracts/performance.md#efficient-algorithms Streaming is linear in PNG file bytes and uses stream buffering rather than allocating the whole file in this helper.
 * @evidence contracts/performance.md#reuse-equivalent-work Each HTTP response gets its own stream effect; an equal filename does not allow sharing one reader or response lifetime.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper acquires one ReadStream, destroys it on response close, withdraws the close listener when the stream closes and retains no stream cache.
 */
export function sendHumanViewerPng(
  response: ServerResponse,
  file: string,
  headers: Record<string, string>,
): void {
  response.setHeader("Content-Type", "image/png");
  for (const [name, value] of Object.entries(headers))
    response.setHeader(name, value);
  const source: fs.ReadStream = fs.createReadStream(file);
  const close: () => void = (): void => {
    source.destroy();
  };
  response.once("close", close);
  source.once("close", (): void => {
    response.off("close", close);
  });
  source.once("error", (error: Error): void => {
    response.destroy(error);
  });
  source.pipe(response);
}
