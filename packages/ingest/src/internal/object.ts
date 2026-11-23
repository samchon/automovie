/** Require a non-null non-array JSON record at its owning path. */
export const object: (
  value: unknown,
  path: string,
) => Record<string, unknown> = (
  value: unknown,
  path: string,
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
};
