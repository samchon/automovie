import { canonicalizeAutoMovieJson } from "@automovie/engine";

/**
 * Canonical JSON bytes for a fingerprint field.
 *
 * The bytes are the UTF-8 encoding of the engine's canonical text. That text never contains a lone surrogate, so these bytes equal the engine's pure UTF-8 encoding of the same text and every runtime digests one byte sequence.
 *
 * @evidence contracts/common.md#principled-implementation The engine's scalar-safe canonical JSON text is encoded with Node UTF-8, matching the browser encoder's byte domain.
 * @evidence contracts/common.md#clear-and-simple-design This byte adapter leaves value admission and key order with the shared engine owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No locale order, replacement decoding or production-specific value exception is added.
 * @evidence contracts/common.md#meaningful-documentation States canonical text-to-byte equivalence and fresh returned-buffer ownership.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes engine tree traversal/key sorting and O(C) encoding with canonical text and C output bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonicalization is shared by all identity composers; no retained byte cache assumes object contents remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned buffer belongs to the caller; engine temporary ancestry and encoded text expire after completion.
 */
export const canonicalAutoMovieJsonBytes: (value: unknown) => Uint8Array = (value: unknown): Uint8Array => Buffer.from(canonicalizeAutoMovieJson(value), "utf8");
