import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Scan string-valued ids with a seen set, reporting later occurrences at supplied paths.
 *
 * @evidence contracts/common.md#principled-implementation Scan string-valued ids with a seen set, reporting later occurrences at supplied paths.
 * @evidence contracts/common.md#clear-and-simple-design Callers own identity extraction and this helper owns ordered duplicate detection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-string ids are skipped here and must be admitted by each element's id gate.
 * @evidence contracts/common.md#meaningful-documentation Rows/labels are borrowed and repeated string ids retain exact authored spelling.
 * @evidence contracts/performance.md#efficient-algorithms N rows take expected O(N) set work and O(U) retained strings during the call.
 * @evidence contracts/performance.md#reuse-equivalent-work The local set shares first-seen lookup without cross-artifact caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The set releases after validation; only caller-owned diagnostics remain.
 */
export const validateUniqueBy: (
  entries: { id: unknown; path: string }[],
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  entries: { id: unknown; path: string }[],
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const seen: Set<string> = new Set<string>();
  for (const entry of entries) {
    if (typeof entry.id !== "string") continue;
    if (seen.has(entry.id))
      pushViolation(
        violations,
        "type",
        entry.path,
        `${label} "${entry.id}" must be unique`,
        entry.id,
      );
    seen.add(entry.id);
  }
};
