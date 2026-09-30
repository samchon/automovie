import { gunzipSync } from "node:zlib";

/**
 * The identity a gzipped basis file opens with.
 *
 * A basis file begins `{"id": ...`, so the identity is read from the opening
 * bytes without parsing the whole tens-of-megabytes document. A file that does
 * not open that way is not a basis the viewer can name and refuses. Pure over
 * the bytes.
 */
export function readHumanViewerBasisIdentity(bytes: Uint8Array): string {
  const id = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(
    gunzipSync(bytes).toString("utf8"),
  );
  if (id === null) throw new Error("Basis does not open with an identity");
  return JSON.parse(id[1]!) as string;
}
