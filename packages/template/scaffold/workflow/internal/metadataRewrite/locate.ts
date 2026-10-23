/** Maps a byte offset to a one-based line and Unicode text column. */
export function locate(
  bytes: Buffer,
  offset: number,
): { line: number; column: number } {
  const prefix: string = bytes.subarray(0, offset).toString("utf8");
  const parts: string[] = prefix.split(/\r\n|\r|\n/u);
  return { line: parts.length, column: [...parts.at(-1)!].length + 1 };
}
