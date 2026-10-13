import { constants, gunzipSync } from "node:zlib";

/**
 * The identity a gzipped basis file opens with.
 *
 * A basis file begins `{"id": ...`, so the identity is read from the opening
 * bytes without inflating the whole tens-of-megabytes document, which took
 * seconds and froze the server. A file that does
 * not open that way is not a basis the viewer can name and refuses. Pure over
 * the bytes.
 *
 * @evidence contracts/common.md#principled-implementation Partial gzip inflation and the existing leading-id packet convention extract only basis identity; this bounded header read does not certify the complete asset schema.
 * @evidence contracts/common.md#clear-and-simple-design One prefix reader supplies catalogue identity without decoding an entire numerical basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the supplied compressed bytes and refuses a missing opening identity without a subject-specific asset name or fitted geometry fallback.
 * @evidence contracts/common.md#meaningful-documentation Explains the leading-id precondition, partial inflation purpose and separation from whole-basis admission.
 */
export function readHumanViewerBasisIdentity(bytes: Uint8Array): string {
  const id = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(
    gunzipSync(bytes.subarray(0, 8192), {
      finishFlush: constants.Z_SYNC_FLUSH,
    }).toString("utf8"),
  );
  if (id === null) throw new Error("Basis does not open with an identity");
  return JSON.parse(id[1]!) as string;
}
