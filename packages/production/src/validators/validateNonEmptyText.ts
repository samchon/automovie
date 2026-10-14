import { pushViolation } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Append one path-located finding when a value is not non-empty text.
 * Non-strings and whitespace-only strings are refused without changing input.
 *
 * @evidence contracts/common.md#principled-implementation A typeof guard admits text, and ECMAScript trim determines whether it contains any non-whitespace character while preserving the original diagnostic value.
 * @evidence contracts/common.md#clear-and-simple-design One append-only primitive supplies the same raw-payload text rule to resident commit preconditions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No label or caller changes admission and text is neither coerced nor rewritten to pass.
 * @evidence contracts/common.md#meaningful-documentation States accepted content, both refusal causes and unmodified input ownership.
 * @evidence contracts/performance.md#efficient-algorithms The string check is constant work and trimming takes O(L) time and transient space for text length L; at most one finding is appended.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one field and coordinates no repeated work or cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the append-only finding array and its original value; the temporary trimmed string is not retained.
 */
export function validateNonEmptyText(text: unknown, path: string, label: string, violations: IAutoMovieConstraintViolation[]): void {
  if (typeof text !== "string") {
    pushViolation(violations, "type", path, `${label} must be a string`, text);
    return;
  }
  if (text.trim().length === 0)
    pushViolation(
      violations,
      "type",
      path,
      `${label} must be non-empty text`,
      text,
    );
}
