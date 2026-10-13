import { decodeAutoMovieUtf8 } from "./strictUtf8";

/**
 * Normalize source without erasing meaningful whitespace.
 *
 * @evidence contracts/common.md#principled-implementation The strict UTF-8 owner validates scalar bytes, strips one leading BOM and converts CRLF and CR to LF while retaining other text.
 * @evidence contracts/common.md#clear-and-simple-design This source-only byte projection serves content and derivation identity; raw-byte ownership remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whitespace, interior BOMs and Unicode normalization forms are preserved; malformed UTF-8 is refused rather than replaced.
 * @evidence contracts/common.md#meaningful-documentation States the allowed BOM/EOL equivalence and strict-decoding refusal; callers retain their input array.
 * @evidence contracts/performance.md#efficient-algorithms Validation, decoding, EOL replacement and UTF-8 encoding traverse B bytes and allocate text/output proportional to B.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller may reuse these normalized bytes within its identity composition; this function caches no result over mutable input arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fresh output buffer transfers to the caller and intermediate text expires with the synchronous call; no handle is acquired.
 */
export const normalizeAutoMovieSource: (source: Uint8Array) => Uint8Array = (source: Uint8Array): Uint8Array => {
    const text: string = decodeAutoMovieUtf8({
        record: "source",
        bytes: source,
        leadingBom: "strip",
    });
    return Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
};
