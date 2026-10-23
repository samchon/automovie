/** Locates literal non-overlapping occurrences. */
export function occurrenceOffsets(text: string, token: string): number[] {
  const offsets: number[] = [];
  for (let offset: number = 0; ; ) {
    const found: number = text.indexOf(token, offset);
    if (found === -1) return offsets;
    offsets.push(found);
    offset = found + token.length;
  }
}
