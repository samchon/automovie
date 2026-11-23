/** Finds the first unequal projected byte, including unequal EOF. */
export function firstDifference(before: Buffer, after: Buffer): number {
  const length: number = Math.min(before.length, after.length);
  for (let index: number = 0; index < length; index += 1)
    if (before[index] !== after[index]) return index;
  return length;
}
