import { object } from "./object";

/**
 * Read an absent optional JSON object as an empty record.
 *
 * @evidence contracts/common.md#principled-implementation Undefined alone means omitted; a supplied value must pass the shared non-null non-array object gate.
 * @evidence contracts/common.md#clear-and-simple-design This wrapper owns omission semantics while object identity and path diagnostics stay in the required-object helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null or arrays do not silently become empty optional objects, preserving malformed input distinctions.
 * @evidence contracts/common.md#meaningful-documentation Comments state undefined-only omission and borrowed identity for supplied valid records.
 * @evidence contracts/performance.md#efficient-algorithms One omission test and at most one object gate require constant time without property scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Required and optional records share the same object admission predicate instead of separate coercion logic.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Omission allocates one empty record; supplied records are borrowed with no retained handle or cache.
 * @author Samchon
 */
export const optionalObject: (
  value: unknown,
  path: string,
) => Record<string, unknown> = (
  value: unknown,
  path: string,
): Record<string, unknown> => (value === undefined ? {} : object(value, path));
