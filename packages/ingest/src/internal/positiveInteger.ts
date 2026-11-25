/** Require a positive safe-integer glTF count or declared byte length. */
export const positiveInteger: (value: unknown, path: string) => void = (
  value: unknown,
  path: string,
): void => {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value <= 0
  )
    throw new Error(`${path} must be a positive safe integer.`);
};
