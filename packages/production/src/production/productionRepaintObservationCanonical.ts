import { canonicalAutoMovieJsonBytes } from "./contentIdentity";

/**
 * Convert canonical observation UTF-8 bytes back to text for exact metadata equality. The shared canonical owner admits JSON state and scalar-safe strings; unsupported extra state can throw. This roundtrip retains no prior observation and resolves no document or artifact.
 *
 * @evidence contracts/common.md#principled-implementation Common canonical key/value ordering yields one UTF-8 byte sequence that Node decodes to the exact canonical comparison string.
 * @evidence contracts/common.md#clear-and-simple-design Observation equality delegates canonical representation to the existing shared owner instead of another field-order policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary JSON normalization or unsupported extra state is not silently dropped to make observations equal.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact canonical equality, possible admission throw and no artifact/document observation.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes complete tree traversal/key sorting, UTF-8 encoding, a Buffer copy and decoding; transient canonical text and encoded copies scale with the complete metadata value.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar encoding adapter coordinates no requests or retained canonical-value cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoded/copy buffers expire and only the comparison string escapes; no source object, artifact bytes or handle is retained.
 */
export const productionRepaintObservationCanonical: (value: unknown) => string = (value: unknown): string =>
  Buffer.from(canonicalAutoMovieJsonBytes(value)).toString("utf8");
