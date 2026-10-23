import { UTF8 } from "./UTF8";
import { invalidUtf8Offset } from "./invalidUtf8Offset";
import { locate } from "./locate";

/**
 * Decodes strictly and reports the exact first invalid source byte.
 *
 * @evidence contracts/common.md#principled-implementation Validate UTF-8 sequences before fatal decoding so failures identify original invalid bytes.
 * @evidence contracts/common.md#clear-and-simple-design Validation, coordinate formatting and decoding have separate helper owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid bytes throw rather than enter lossy decoding or retry paths.
 * @evidence contracts/common.md#meaningful-documentation The comment states strict decoding; diagnostics give file, side, location and byte.
 * @evidence contracts/performance.md#efficient-algorithms Validation and decoding scan B bytes with O(B) output; errors also locate their prefix.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed decoder is shared, but each distinct input requires byte validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No bytes are retained after return or throw; resulting text is caller-owned.
 */
export function decode(bytes: Buffer, file: string, side: string): string {
  const invalid: number = invalidUtf8Offset(bytes);
  if (invalid !== -1) {
    const location: { line: number; column: number } = locate(bytes, invalid);
    throw new Error(
      `${file}: ${side} has invalid UTF-8 at ${location.line}:${location.column} (byte ${invalid}); no lossy decoder path is permitted.`,
    );
  }
  return UTF8.decode(bytes);
}
