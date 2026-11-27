/*
 * Recognize a safe integer inside a zero-based inventory.
 */
export function validNodeIndex(value: unknown, length: number): boolean {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value < length
  );
}
