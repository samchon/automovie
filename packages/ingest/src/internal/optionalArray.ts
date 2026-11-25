import { requiredArray } from "./requiredArray";

/** Read an absent optional JSON array as an empty inventory. */
export const optionalArray: (value: unknown, path: string) => unknown[] = (
  value: unknown,
  path: string,
): unknown[] => (value === undefined ? [] : requiredArray(value, path));
