/** Require an actual JSON array at a named external-document path. */
export const requiredArray: (value: unknown, path: string) => unknown[] = (
  value: unknown,
  path: string,
): unknown[] => {
  if (Array.isArray(value) === false)
    throw new Error(`${path} must be an array.`);
  return value as unknown[];
};
