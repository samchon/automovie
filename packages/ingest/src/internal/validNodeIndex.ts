/** Recognize a safe integer inside a zero-based inventory. */
export const validNodeIndex: (value: unknown, length: number) => boolean = (
  value: unknown,
  length: number,
): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value < length;
