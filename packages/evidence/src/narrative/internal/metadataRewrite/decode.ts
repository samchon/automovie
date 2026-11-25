import { UTF8 } from "./UTF8";
import { invalidUtf8Offset } from "./invalidUtf8Offset";
import { locate } from "./locate";

/** Decodes strictly and reports the exact first invalid source byte. */
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
