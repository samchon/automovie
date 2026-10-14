import { createHash } from "node:crypto";
import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";

/**
 * Hash the ordered role/kind/payload stream with unsigned 64-bit big-endian lengths.
 *
 * @evidence contracts/common.md#principled-implementation Frames each UTF-8 role, UTF-8 kind and exact payload by its eight-byte length before SHA-256, preserving field order and unambiguous component boundaries. Supported JavaScript byte-array lengths fit the length prefix; empty fields and components have explicit encodings.
 * @evidence contracts/common.md#clear-and-simple-design One shared binary encoder serves build, derivation, render and rendition fingerprints without interpreting their field domains; callers own namespace, protocol and input selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No label, path or payload receives an exception or implicit source normalization; payload stability during the synchronous call is a caller premise, and digest equality does not itself prove complete dependency accounting.
 * @evidence contracts/common.md#meaningful-documentation States UTF-8 labels, byte payloads, u64be framing, ordered composition and stable-buffer ownership; returns a lowercase sha256-prefixed digest without retaining inputs.
 * @evidence contracts/performance.md#efficient-algorithms For F fields with B total label/payload bytes, encoding and hashing take O(B+F) time; only current labels and fixed-size length prefixes are allocated, and payload buffers are consumed directly rather than fully copied.
 * @evidence contracts/performance.md#reuse-equivalent-work Each supplied payload already contains its composer's bytes and is reused directly by synchronous hash.update; label encodings and lengths are local to the field, with no cache over mutable input arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local hash finalizes before return and current label/prefix buffers become unreachable; the caller keeps original payload ownership and receives only the digest string. No file or background task is acquired.
 */
export function fingerprintAutoMovieFields(fields: readonly IAutoMovieFingerprintField[]): string {
  const hash: ReturnType<typeof createHash> = createHash("sha256");
  for (const field of fields)
    for (const value of [Buffer.from(field.role, "utf8"), Buffer.from(field.kind, "utf8"), field.payload]) {
      const size: Buffer = Buffer.alloc(8);
      size.writeBigUInt64BE(BigInt(value.length));
      hash.update(size);
      hash.update(value);
    }
  return `sha256:${hash.digest("hex")}`;
}
