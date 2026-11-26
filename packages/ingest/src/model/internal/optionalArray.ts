import { requiredArray } from "./requiredArray";

/** Read an absent optional JSON array as an empty inventory. */
export function optionalArray(value: unknown, path: string): unknown[] {
  return value === undefined ? [] : requiredArray(value, path);
}
