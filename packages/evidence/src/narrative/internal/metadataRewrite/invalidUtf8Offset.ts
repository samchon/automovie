import { between } from "./between";
import { continuation } from "./continuation";

/** Returns the first invalid UTF-8 sequence start, or -1 for strict UTF-8. */
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
