/** Finds the first HTML closing marker, including a malformed inline close. */
export function findClose(lines: string[], start: number): number {
  for (let index: number = start; index < lines.length; index += 1)
    if (lines[index].includes("-->")) return index;
  return -1;
}
