/** Returns a line without consuming its exact ending. */
export function withoutEnding(line: string): string {
  return line.replace(/(?:\r\n|\r|\n)$/u, "");
}
