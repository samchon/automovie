import { optionalArray } from "./optionalArray";

/**
 * Read an omitted or nonblank-string glTF extension inventory.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Omission produces an empty array; supplied arrays must contain only nonblank strings with path/index diagnostics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Optional-array identity is delegated and this owner adds extension-name element admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names are not trimmed or case-folded, preserving exact identifiers after nonblank validation.
 * @evidence contracts/development/common.md#meaningful-documentation The description explains omission, exact spelling preservation and indexed error paths.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is linear in element count plus trim scans of string lengths, with one returned array.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each name is checked once for this inventory; exact duplicate removal belongs to the downstream canonical inventory.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string array survives; original arrays and validation metadata are not retained.
 */
export const optionalStringArray: (value: unknown, path: string) => string[] = (
  value: unknown,
  path: string,
): string[] =>
  optionalArray(value, path).map((entry: unknown, index: number): string => {
    if (typeof entry !== "string" || entry.trim().length === 0)
      throw new Error(`${path}[${index}] must be a non-blank string.`);
    return entry;
  });
