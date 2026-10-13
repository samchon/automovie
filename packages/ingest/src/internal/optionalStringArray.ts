import { optionalArray } from "./optionalArray";

/**
 * Read an omitted or nonblank-string glTF extension inventory.
 *
 * Omission produces an empty array; supplied arrays must contain only nonblank strings with path/index diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Omission produces an empty array; supplied arrays must contain only nonblank strings with path/index diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Optional-array identity is delegated and this owner adds extension-name element admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names are not trimmed or case-folded, preserving exact identifiers after nonblank validation.
 * @evidence contracts/common.md#meaningful-documentation The description explains omission, exact spelling preservation and indexed error paths.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in element count plus trim scans of string lengths, with one returned array.
 * @evidence contracts/performance.md#reuse-equivalent-work Each name is checked once for this inventory; exact duplicate removal belongs to the downstream canonical inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string array survives; original arrays and validation metadata are not retained.
 * @author Samchon
 */
export const optionalStringArray: (value: unknown, path: string) => string[] = (value: unknown, path: string): string[] =>
  optionalArray(value, path).map((entry: unknown, index: number): string => {
    if (typeof entry !== "string" || entry.trim().length === 0)
      throw new Error(`${path}[${index}] must be a non-blank string.`);
    return entry;
  });
