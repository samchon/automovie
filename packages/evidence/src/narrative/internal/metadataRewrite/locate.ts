/**
 * Maps a byte offset to a one-based line and Unicode text column.
 *
 * @evidence contracts/common.md#principled-implementation Decode a byte prefix, split CRLF, CR or LF and count final-line Unicode code points.
 * @evidence contracts/common.md#clear-and-simple-design Byte coordinates enter; one-based text coordinates leave for diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Columns count code points rather than treating UTF-16 units as bytes.
 * @evidence contracts/common.md#meaningful-documentation The comment states byte-to-one-based-line and Unicode-column mapping.
 * @evidence contracts/performance.md#efficient-algorithms A P-byte prefix needs O(P) decoding, splitting and transient space.
 * @evidence contracts/performance.md#reuse-equivalent-work Each diagnostic offset determines its prefix; no full-file index is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prefix strings, line arrays and code-point arrays are call-local; only numbers are returned.
 */
export function locate(
  bytes: Buffer,
  offset: number,
): { line: number; column: number } {
  const prefix: string = bytes.subarray(0, offset).toString("utf8");
  const parts: string[] = prefix.split(/\r\n|\r|\n/u);
  return { line: parts.length, column: [...parts.at(-1)!].length + 1 };
}
