import { between } from "./between";
import { continuation } from "./continuation";

/**
 * Returns the first invalid UTF-8 sequence start, or -1 for strict UTF-8.
 *
 * @evidence contracts/common.md#principled-implementation Validate UTF-8 byte classes, rejecting truncation, overlong forms, surrogates and values above U+10ffff.
 * @evidence contracts/common.md#clear-and-simple-design One advancing index reports the first invalid sequence start without decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ranges implement encoding constraints; invalid sequences are never replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment defines invalid-start offsets and -1 for valid input.
 * @evidence contracts/performance.md#efficient-algorithms Each byte is inspected a bounded number of times: O(B) time and constant auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared range predicates are reused; every distinct buffer still requires validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed buffer is not retained; only scalar indexes are owned.
 */
export function invalidUtf8Offset(bytes: Buffer): number {
  for (let index: number = 0; index < bytes.length; ) {
    const first: number = bytes[index];
    if (first <= 0x7f) {
      index += 1;
      continue;
    }
    if (first >= 0xc2 && first <= 0xdf) {
      if (!continuation(bytes[index + 1])) return index;
      index += 2;
      continue;
    }
    if (first === 0xe0) {
      if (
        !between(bytes[index + 1], 0xa0, 0xbf) ||
        !continuation(bytes[index + 2])
      )
        return index;
      index += 3;
      continue;
    }
    if ((first >= 0xe1 && first <= 0xec) || (first >= 0xee && first <= 0xef)) {
      if (!continuation(bytes[index + 1]) || !continuation(bytes[index + 2]))
        return index;
      index += 3;
      continue;
    }
    if (first === 0xed) {
      if (
        !between(bytes[index + 1], 0x80, 0x9f) ||
        !continuation(bytes[index + 2])
      )
        return index;
      index += 3;
      continue;
    }
    if (first === 0xf0) {
      if (
        !between(bytes[index + 1], 0x90, 0xbf) ||
        !continuation(bytes[index + 2]) ||
        !continuation(bytes[index + 3])
      )
        return index;
      index += 4;
      continue;
    }
    if (first >= 0xf1 && first <= 0xf3) {
      if (
        !continuation(bytes[index + 1]) ||
        !continuation(bytes[index + 2]) ||
        !continuation(bytes[index + 3])
      )
        return index;
      index += 4;
      continue;
    }
    if (first === 0xf4) {
      if (
        !between(bytes[index + 1], 0x80, 0x8f) ||
        !continuation(bytes[index + 2]) ||
        !continuation(bytes[index + 3])
      )
        return index;
      index += 4;
      continue;
    }
    return index;
  }
  return -1;
}
