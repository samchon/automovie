import { object } from "./object";

/** Read an absent optional JSON object as an empty record. */
export function optionalObject(
  value: unknown,
  path: string,
): Record<string, unknown> {
  return value === undefined ? {} : object(value, path);
}
