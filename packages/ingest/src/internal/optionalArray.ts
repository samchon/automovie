import { requiredArray } from "./requiredArray";

/**
 * Read an absent optional JSON array as an empty inventory.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Undefined alone produces an empty array; supplied values must pass the common Array.isArray gate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper owns omission while requiredArray owns shape admission and named-path diagnostics.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Null, strings and array-like objects are refused rather than being treated as missing inventories.
 * @evidence contracts/development/common.md#meaningful-documentation Prose identifies the undefined case, unchanged supplied arrays and malformed-value refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms One omission check and constant-time array identity test run without scanning elements.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same required-array operation is reused for every present optional inventory.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only omitted input creates a new empty array; valid supplied arrays remain borrowed and unretained.
 */
export const optionalArray: (value: unknown, path: string) => unknown[] = (
  value: unknown,
  path: string,
): unknown[] => (value === undefined ? [] : requiredArray(value, path));
