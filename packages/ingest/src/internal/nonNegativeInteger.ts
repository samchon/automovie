/** Require a safe nonnegative glTF byte offset. */
export const nonNegativeInteger: (value: unknown, path: string) => void = (
  value: unknown,
  path: string,
): void => {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value < 0
  )
    throw new Error(`${path} must be a non-negative safe integer.`);
};
