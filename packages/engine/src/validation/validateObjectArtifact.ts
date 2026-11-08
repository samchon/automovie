import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";

/**
 * Require the shallow non-null non-array object shape and append a labeled type fault otherwise.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Require the shallow non-null non-array object shape and append a labeled type fault otherwise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure isRecord owns the structural boundary for clip/shot/track records.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Passing shape does not certify field schema or a plain JSON object.
 * @evidence contracts/development/common.md#meaningful-documentation The boolean type guard lets callers safely continue field-level checks.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant shallow work plus failure label text is required.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical isRecord is reused instead of independent null/array menus.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The input remains borrowed and only caller-owned diagnostics escape.
 */
export const validateObjectArtifact: (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => value is Record<string, unknown> = (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): value is Record<string, unknown> => {
  if (isRecord(value)) return true;
  pushViolation(
    violations,
    "type",
    path,
    `${label} must be a JSON object`,
    value,
  );
  return false;
};
