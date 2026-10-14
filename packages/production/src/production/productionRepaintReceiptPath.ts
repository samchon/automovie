import path from "node:path";
import { digestAutoMovieBytes } from "./contentIdentity";

/**
 * Convert one render-root path to the corresponding tracked receipt path.
 *
 * Hash exact UTF-8 path text, without filesystem normalization or existence checks. The returned POSIX-relative JSON path is only an address; the project owns namespace admission and atomic publication.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 of exact output-path UTF-8 bytes supplies the receipt leaf under renditions, so caller path spelling defines identity.
 * @evidence contracts/common.md#clear-and-simple-design Receipt addressing is independent of output admission and transaction state, with POSIX separators supplied by the Node path owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No current filesystem state or normalized alias substitutes for the supplied path, and an address alone proves no resident receipt.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact-text hashing, no filesystem effect and the project publication boundary.
 * @evidence contracts/performance.md#efficient-algorithms Encoding and hashing L path bytes cost O(L), with one encoded buffer and fixed-size digest/path suffix.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar path derivation owns no cross-request coordinator or retained address cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary UTF-8 buffer/hash expire synchronously and only the receipt-path string escapes; no file handle starts.
 */
export const productionRepaintReceiptPath: (outputPath: string) => string = (outputPath: string): string =>
  path.posix.join(
    "renditions",
    `${digestAutoMovieBytes(Buffer.from(outputPath, "utf8")).slice(7)}.json`,
  );
