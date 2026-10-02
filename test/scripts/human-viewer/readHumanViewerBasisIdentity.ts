import { constants, gunzipSync } from "node:zlib";

/**
 * The identity a gzipped basis file opens with.
 *
 * A basis file begins `{"id": ...`, so the identity is read from the opening
 * bytes without inflating the whole tens-of-megabytes document, which took
 * seconds and froze the server. A file that does
 * not open that way is not a basis the viewer can name and refuses. Pure over
 * the bytes.
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
