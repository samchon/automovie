import fs from "node:fs";
import type { ServerResponse } from "node:http";

/**
 * Stream a stored PNG with its provenance headers (build source, revision
 * and whether it is stale), so a thumbnail answered from disk says what drew it.
 *
 * @evidence contracts/common.md#clear-and-simple-design One response helper serves every stored thumbnail answer.
 * @evidence contracts/common.md#principled-implementation Streams the caller-selected stored image and provenance headers together; the caller retains source selection and staleness authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sends existing file bytes without image synthesis, hidden rescaling or manufactured current-source headers.
 * @evidence contracts/common.md#meaningful-documentation States the headers' role.
 */
export function sendHumanViewerPng(
  response: ServerResponse,
  file: string,
  headers: Record<string, string>,
): void {
  response.setHeader("Content-Type", "image/png");
  for (const [name, value] of Object.entries(headers))
    response.setHeader(name, value);
  fs.createReadStream(file).pipe(response);
}
