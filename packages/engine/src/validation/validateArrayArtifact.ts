import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Require Array.isArray and append a type fault for every other top-level shape.
 *
 * @evidence contracts/common.md#principled-implementation Require Array.isArray and append a type fault for every other top-level shape.
 * @evidence contracts/common.md#clear-and-simple-design This shallow gate separates list shape from the element validators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Array length, density and element schemas are not admitted by this predicate.
 * @evidence contracts/common.md#meaningful-documentation The boolean return permits callers to stop before list-specific dereferences.
 * @evidence contracts/performance.md#efficient-algorithms One shape test uses constant work apart from diagnostic text.
 * @evidence contracts/performance.md#reuse-equivalent-work Clip and shot gates share the same boundary, then validate their own elements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The list is borrowed and only caller-owned diagnostics escape.
 */
export const validateArrayArtifact: (value: unknown, path: string, label: string, violations: IAutoMovieConstraintViolation[]) => value is unknown[] = (
  value: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): value is unknown[] => {
  if (Array.isArray(value)) return true;
  pushViolation(violations, "type", path, `${label} must be an array`, value);
  return false;
};
