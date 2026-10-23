import { locate } from "./locate";

/** Formats one UTF-16 string index as source line, column, and UTF-8 byte. */
export function textLocation(text: string, index: number): string {
  const byte: number = Buffer.byteLength(text.slice(0, index), "utf8");
  const location: { line: number; column: number } = locate(
    Buffer.from(text, "utf8"),
    byte,
  );
  return `${location.line}:${location.column} (byte ${byte})`;
}
