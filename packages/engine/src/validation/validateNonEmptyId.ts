import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Require a string with at least one non-whitespace code unit and append a type fault otherwise.
 *
 * @evidence contracts/common.md#principled-implementation Require a string with at least one non-whitespace code unit and append a type fault otherwise.
 * @evidence contracts/common.md#clear-and-simple-design Artifact gates share nonblank identifier admission without a project registry lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original string is not trimmed or rewritten, so identity remains exactly authored.
 * @evidence contracts/common.md#meaningful-documentation The void append-only effect distinguishes non-string and blank-string faults without rewriting the id.
 * @evidence contracts/performance.md#efficient-algorithms S identifier code units drive trim work; no graph traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work All artifact ids use this predicate, while uniqueness/reference checks remain separate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a failure row escapes into the caller list, retaining no registry or request state.
 */
export const validateNonEmptyId: (id: unknown, path: string, label: string, violations: IAutoMovieConstraintViolation[]) => void = (
  id: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (typeof id !== "string") {
    pushViolation(violations, "type", path, `${label} must be a string`, id);
    return;
  }
  if (id.trim().length === 0)
    pushViolation(
      violations,
      "type",
      path,
      `${label} must be a non-empty id`,
      id,
    );
};
