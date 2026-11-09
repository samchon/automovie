import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Require a string with at least one non-whitespace code unit and append a type fault otherwise.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Require a string with at least one non-whitespace code unit and append a type fault otherwise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Artifact gates share nonblank identifier admission without a project registry lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original string is not trimmed or rewritten, so identity remains exactly authored.
 * @evidence contracts/development/common.md#meaningful-documentation The void append-only effect distinguishes non-string and blank-string faults without rewriting the id.
 * @evidence contracts/development/implementation.md#efficient-algorithms S identifier code units drive trim work; no graph traversal occurs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All artifact ids use this predicate, while uniqueness/reference checks remain separate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a failure row escapes into the caller list, retaining no registry or request state.
 */
export const validateNonEmptyId: (
  id: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
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
