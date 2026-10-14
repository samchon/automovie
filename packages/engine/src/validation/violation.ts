import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

/**
 * Construct a fresh constraint row with supplied fields, optional overshoot and caller severity defaulting to error.
 *
 * @evidence contracts/common.md#principled-implementation Construct a fresh constraint row with supplied fields, optional overshoot and caller severity defaulting to error.
 * @evidence contracts/common.md#clear-and-simple-design One row owner serves collector/artifact producers without embedding validation predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual values are borrowed unchanged; warning severity is explicit rather than inferred from a caller.
 * @evidence contracts/common.md#meaningful-documentation Optional overshoot omission and the error default are stated.
 * @evidence contracts/performance.md#efficient-algorithms One record allocation is constant work; supplied value/text population drives retained bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work pushViolation/collector callers reuse the canonical shape but each call creates its own row.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the row and borrowed value lifetime; no internal list or native resource remains.
 */
export const violation: (kind: AutoMovieViolationKind, path: string, expected: string, value: unknown, overshoot?: number, severity?: "error" | "warning") => IAutoMovieConstraintViolation = (
  kind: AutoMovieViolationKind,
  path: string,
  expected: string,
  value: unknown,
  overshoot?: number,
  severity: "error" | "warning" = "error",
): IAutoMovieConstraintViolation =>
  overshoot === undefined
    ? { kind, path, expected, value, severity }
    : { kind, path, expected, value, overshoot, severity };
