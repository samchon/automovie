import { constants, gunzipSync } from "node:zlib";

/**
 * The identity a gzipped basis file opens with.
 *
 * A basis file begins `{"id": ...`, so the identity is read from the opening bytes without inflating the whole tens-of-megabytes document, which took seconds and froze the server. A file that does not open that way is not a basis the viewer can name and refuses. Pure over the bytes.
 *
 * @evidence contracts/common.md#principled-implementation The first 8192 compressed bytes are partially inflated and their anchored leading JSON id string is parsed normally.
 * @evidence contracts/common.md#clear-and-simple-design A prefix inflate and id expression avoid synchronous whole-basis JSON parsing for catalogue naming.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing leading identity refuses; this prefix reader does not certify full basis schema or complete gzip integrity.
 * @evidence contracts/common.md#meaningful-documentation The comment defines leading-id authority and the whole-file blocking work avoided.
 * @evidence contracts/performance.md#efficient-algorithms Compressed input is bounded to 8192 bytes but inflated prefix size depends on compression ratio; matching follows that output.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied bytes are observed without another basis identity memo or alternate asset cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned id survives and prefix buffers retain no file descriptor or numerical geometry.
 */
export function readHumanViewerBasisIdentity(bytes: Uint8Array): string {
  const id: RegExpExecArray | null = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(
    gunzipSync(bytes.subarray(0, 8192), {
      finishFlush: constants.Z_SYNC_FLUSH,
    }).toString("utf8"),
  );
  if (id === null) throw new Error("Basis does not open with an identity");
  return JSON.parse(id[1]!) as string;
}
