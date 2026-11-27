/*
 * Require a safe nonnegative glTF byte offset.
 */
export function nonNegativeInteger(value: unknown, path: string): void {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value < 0
  )
    throw new Error(`${path} must be a non-negative safe integer.`);
}
