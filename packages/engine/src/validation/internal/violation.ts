import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

/*
 * Construct a fresh constraint row with supplied fields, optional overshoot and
 * caller severity defaulting to error.
 */
export const violation: (
  kind: AutoMovieViolationKind,
  path: string,
  expected: string,
  value: unknown,
  overshoot?: number,
  severity?: "error" | "warning",
) => IAutoMovieConstraintViolation = (
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
