import { locate } from "./locate";

/**
 * Formats one UTF-16 string index as source line, column, and UTF-8 byte.
 *
 * @evidence contracts/common.md#principled-implementation Convert a UTF-16 index to its UTF-8 prefix length, then locate that byte boundary in source text.
 * @evidence contracts/common.md#clear-and-simple-design The adapter connects string-search indexes with byte-coordinate diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UTF-16 positions are never assumed to equal UTF-8 byte offsets.
 * @evidence contracts/common.md#meaningful-documentation The comment names UTF-16 input, source line and column, and UTF-8 output units.
 * @evidence contracts/performance.md#efficient-algorithms Prefix and full-text encoding plus location conversion cost O(B) time and transient space for B bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work locate supplies shared Unicode-column rules; different candidate strings need distinct temporary encodings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Buffers, prefixes and line arrays expire locally; the result is one diagnostic string.
 */
export function textLocation(text: string, index: number): string {
  const byte: number = Buffer.byteLength(text.slice(0, index), "utf8");
  const location: { line: number; column: number } = locate(
    Buffer.from(text, "utf8"),
    byte,
  );
  return `${location.line}:${location.column} (byte ${byte})`;
}
