import { object } from "./object";

/** Read an absent optional JSON object as an empty record. */
export const optionalObject: (
  value: unknown,
  path: string,
) => Record<string, unknown> = (
  value: unknown,
  path: string,
): Record<string, unknown> => (value === undefined ? {} : object(value, path));
