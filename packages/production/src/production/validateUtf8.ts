import { AutoMovieUtf8Error } from "./AutoMovieUtf8Error";

/**
 * Reject the first unsupported UTF-8 scalar sequence at its existing proving byte offset.
 *
 * @evidence contracts/common.md#principled-implementation Classifies one-to-four-byte leaders and bounded continuation tails, excluding overlong forms, surrogate scalars and values above U+10FFFF; existing failure categories and offsets remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One scalar walk feeds strict text decoding, with the small continuation helper retaining tail bounds and exact offending-byte context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It validates bytes rather than delegating to replacement decoding; BOM policy and text normalization remain outside this owner.
 * @evidence contracts/common.md#meaningful-documentation States scalar admission, first proving offsets and typed failures; callers provide a Uint8Array byte view.
 * @evidence contracts/performance.md#efficient-algorithms Cursor advancement is O(B); each classified scalar checks at most three continuation bytes with constant auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work No state or prior validity answer is retained across potentially mutable byte populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller owns the input view; a thrown Error retains diagnostic text/offset rather than the byte buffer, and no resource is opened.
 *
 * @author Samchon
 */
export function validateUtf8(record: string, bytes: Uint8Array): void {
  let cursor: number = 0;
  while (cursor < bytes.length) {
    const leader: number = bytes[cursor]!;
    if (leader <= 0x7f) {
      cursor += 1;
      continue;
    }
    if (leader >= 0x80 && leader <= 0xbf)
      throw new AutoMovieUtf8Error(record, cursor, "isolated-continuation");
    if (leader === 0xc0 || leader === 0xc1)
      throw new AutoMovieUtf8Error(record, cursor, "overlong-sequence");
    if (leader >= 0xc2 && leader <= 0xdf) {
      requireContinuation(record, bytes, cursor, 1);
      cursor += 2;
      continue;
    }
    if (leader >= 0xe0 && leader <= 0xef) {
      requireContinuation(record, bytes, cursor, 1);
      const second: number = bytes[cursor + 1]!;
      if (leader === 0xe0 && second < 0xa0)
        throw new AutoMovieUtf8Error(record, cursor, "overlong-sequence");
      if (leader === 0xed && second >= 0xa0)
        throw new AutoMovieUtf8Error(record, cursor, "surrogate-scalar");
      requireContinuation(record, bytes, cursor, 2);
      cursor += 3;
      continue;
    }
    if (leader >= 0xf0 && leader <= 0xf4) {
      requireContinuation(record, bytes, cursor, 1);
      const second: number = bytes[cursor + 1]!;
      if (leader === 0xf0 && second < 0x90)
        throw new AutoMovieUtf8Error(record, cursor, "overlong-sequence");
      if (leader === 0xf4 && second > 0x8f)
        throw new AutoMovieUtf8Error(record, cursor, "out-of-range-scalar");
      requireContinuation(record, bytes, cursor, 3);
      cursor += 4;
      continue;
    }
    throw new AutoMovieUtf8Error(record, cursor, "invalid-leader");
  }
}

/** Check the already classified scalar's bounded continuation tail. */
function requireContinuation(
  record: string,
  bytes: Uint8Array,
  leaderOffset: number,
  count: number,
): void {
  for (let index: number = 1; index <= count; ++index) {
    const offset: number = leaderOffset + index;
    if (offset >= bytes.length)
      throw new AutoMovieUtf8Error(record, leaderOffset, "truncated-sequence");
    const byte: number = bytes[offset]!;
    if (byte < 0x80 || byte > 0xbf)
      throw new AutoMovieUtf8Error(record, offset, "invalid-continuation");
  }
}
