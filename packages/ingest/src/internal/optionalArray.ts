import { requiredArray } from "./requiredArray";

/**
 * Read an absent optional JSON array as an empty inventory.
 *
 * @evidence contracts/common.md#principled-implementation Undefined alone produces an empty array; supplied values must pass the common Array.isArray gate.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper owns omission while requiredArray owns shape admission and named-path diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null, strings and array-like objects are refused rather than being treated as missing inventories.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies the undefined case, unchanged supplied arrays and malformed-value refusal.
 * @evidence contracts/performance.md#efficient-algorithms One omission check and constant-time array identity test run without scanning elements.
 * @evidence contracts/performance.md#reuse-equivalent-work The same required-array operation is reused for every present optional inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only omitted input creates a new empty array; valid supplied arrays remain borrowed and unretained.
 * @author Samchon
 */
export const optionalArray: (value: unknown, path: string) => unknown[] = (
  value: unknown,
  path: string,
): unknown[] => (value === undefined ? [] : requiredArray(value, path));
