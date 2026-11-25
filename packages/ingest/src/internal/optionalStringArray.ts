import { optionalArray } from "./optionalArray";

/** Read an omitted or nonblank-string glTF extension inventory. */
export const optionalStringArray: (value: unknown, path: string) => string[] = (
  value: unknown,
  path: string,
): string[] =>
  optionalArray(value, path).map((entry: unknown, index: number): string => {
    if (typeof entry !== "string" || entry.trim().length === 0)
      throw new Error(`${path}[${index}] must be a non-blank string.`);
    return entry;
  });
